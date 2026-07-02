"""Versioned prompt templates. Keep AI instructions out of services/routes."""
from __future__ import annotations

from app.domain.role_profiles import list_roles

# ---- Career Twin extraction ----------------------------------------------
TWIN_SYSTEM = (
    "You are an expert technical recruiter and resume analyst. You extract a "
    "structured 'Career Twin' from a candidate's resume text and a summary of "
    "their public GitHub. Be accurate and conservative: only include skills, "
    "projects, certifications, and experience that are actually evidenced in the "
    "provided material. Do NOT invent anything. Respond with ONLY a single valid "
    "JSON object matching the requested schema."
)


def twin_user_prompt(resume_text: str, github_summary: str) -> str:
    role_labels = ", ".join(r["label"] for r in list_roles())
    return (
        "Extract the Career Twin as JSON with exactly these keys:\n"
        '{\n'
        '  "contact": {"full_name": string|null, "email": string|null, '
        '"phone": string|null},\n'
        '  "links": {"linkedin": string|null, "github": string|null, '
        '"portfolio": string|null, "other": [string]},\n'
        '  "skills": [string],\n'
        '  "technologies": [string],\n'
        '  "certifications": [{"name": string, "issuer": string|null}],\n'
        '  "projects": [{"name": string, "description": string|null, '
        '"technologies": [string], "source": "resume"|"github"|null}],\n'
        '  "experience": [{"title": string|null, "company": string|null, '
        '"duration": string|null, "description": string|null}],\n'
        '  "education": [{"degree": string|null, "institution": string|null, '
        '"year": string|null}],\n'
        '  "achievements": [string],  // awards, honors, publications, leadership, '
        'extracurricular activities\n'
        '  "inferred_role": string,   // best-fit target role for this candidate\n'
        '  "career_goal": string|null,\n'
        '  "summary": string|null     // 1-2 sentence professional summary\n'
        "}\n\n"
        "Only fill contact/links fields that literally appear in the resume text — "
        "leave them null (or an empty list) rather than guessing. The candidate's "
        "full name is usually the very first line of the resume. A "
        "'[Detected hyperlinks]' block may be appended at the end of the resume "
        "text with URLs the candidate embedded behind icons/links that aren't "
        "otherwise visible as text — use those for the linkedin/github/portfolio "
        "fields when they match, and put any leftover URLs in links.other.\n\n"
        "For achievements, scan the ENTIRE resume, not just a section literally "
        "titled 'Achievements' — also pull from sections titled Activities, "
        "Awards, Honors, Extracurricular, Leadership, Hackathons, Competitions, "
        "Volunteering, or bullet points elsewhere mentioning winning/placing in "
        "a competition, hackathon, datathon, olympiad, or receiving a scholarship "
        "or award. Each achievement should be one short standalone bullet.\n\n"
        f"For inferred_role, prefer one of these labels when it fits: {role_labels}.\n\n"
        "=== RESUME TEXT ===\n"
        f"{resume_text[:12000]}\n\n"
        "=== GITHUB SUMMARY ===\n"
        f"{github_summary[:4000]}\n"
    )


# ---- Hiring Score explanation --------------------------------------------
SCORE_SYSTEM = (
    "You are a career coach explaining a candidate's employability score to them. "
    "The numeric scores were computed by a deterministic engine and are FINAL — "
    "you must NOT change, recompute, or contradict them. Explain clearly and "
    "specifically why the score is what it is and how to improve it. Respond with "
    "ONLY a single valid JSON object."
)


# ---- AI Career Roadmap ----------------------------------------------------
ROADMAP_SYSTEM = (
    "You are a senior career mentor building a phased learning roadmap toward a "
    "specific career goal. Ground it in the candidate's current skills and the "
    "deterministic role-based missing skills provided. Add any extra skills uniquely "
    "required by their stated career goal. Produce a realistic plan of 2-4 phases "
    "from foundations to job-ready, each with concrete skills and an applied project. "
    "Respond with ONLY a single valid JSON object."
)


def roadmap_user_prompt(
    role_label: str,
    career_goal: str | None,
    current_skills: list[str],
    missing_skills: list[str],
) -> str:
    current = ", ".join(current_skills[:40]) or "none listed"
    missing = ", ".join(missing_skills) or "none"
    return (
        f"Target role: {role_label}\n"
        f"Career goal: {career_goal or 'not specified'}\n"
        f"Current skills: {current}\n"
        f"Known missing skills (deterministic, role-based): {missing}\n\n"
        "Build a phased roadmap toward the career goal. Return JSON:\n"
        "{\n"
        '  "summary": string,            // 2-3 sentence overview of the path\n'
        '  "missing_skills": [string],   // consolidated, incl. goal-specific extras\n'
        '  "phases": [\n'
        "    {\n"
        '      "name": string,           // e.g. "Phase 1: Foundations"\n'
        '      "focus": string,          // one-line focus of this phase\n'
        '      "duration": string,       // e.g. "Weeks 1-4"\n'
        '      "skills": [string],       // skills to learn this phase\n'
        '      "why": string,            // why this phase matters for the goal\n'
        '      "project": string         // a project to apply the phase’s skills\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )


# ---- Project Gap Detector -------------------------------------------------
GAP_SYSTEM = (
    "You are a senior engineering mentor designing portfolio projects that make a "
    "candidate employable for a specific target role. Recommend projects the "
    "candidate has NOT already built. Ground every recommendation in their current "
    "skills and target role. Be concrete and realistic. Respond with ONLY a single "
    "valid JSON object."
)


def gap_user_prompt(
    role_label: str,
    current_projects: list[str],
    skills: list[str],
    priority_seeds: list[str],
) -> str:
    projects_text = ", ".join(current_projects) or "none"
    skills_text = ", ".join(skills[:40]) or "none listed"
    seeds_text = ", ".join(priority_seeds) if priority_seeds else "none"
    return (
        f"Target role: {role_label}\n"
        f"Candidate's current projects: {projects_text}\n"
        f"Candidate's current skills: {skills_text}\n"
        f"Priority project gaps to cover first (if any): {seeds_text}\n\n"
        "Recommend exactly 3 portfolio projects the candidate should build next for "
        "this role, prioritizing the gaps above, then adding role-relevant projects "
        "they don't already have. Return JSON:\n"
        "{\n"
        '  "projects": [\n'
        "    {\n"
        '      "name": string,\n'
        '      "description": string,        // 1-2 sentences\n'
        '      "why_it_matters": string,     // why recruiters value it for this role\n'
        '      "difficulty": "Beginner"|"Intermediate"|"Advanced",\n'
        '      "timeline": string,           // e.g. "2-3 weeks"\n'
        '      "architecture": string,       // short architecture overview\n'
        '      "tech_stack": [string],\n'
        '      "key_skills": [string]        // skills the candidate will learn\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )


# ---- Career Simulator roadmap narrative -----------------------------------
SIM_SYSTEM = (
    "You are a career coach narrating a growth roadmap. The current score, each "
    "projected score, and the score deltas were computed by a deterministic engine "
    "by actually re-running the candidate's profile with each change — they are "
    "FINAL and accurate. Do NOT change any number. Explain the path clearly and "
    "motivate the candidate to follow it. Respond with ONLY a single valid JSON "
    "object."
)


def sim_user_prompt(
    role_label: str,
    base_score: int,
    final_score: int,
    roadmap: list[dict],
) -> str:
    steps = "\n".join(
        f"  {i+1}. {s['label']} -> {s['projected_score']}/100 (+{s['delta']})"
        for i, s in enumerate(roadmap)
    ) or "  (no high-impact steps found)"
    return (
        f"Target role: {role_label}\n"
        f"Current Hiring Score: {base_score}/100\n"
        f"Projected score after the roadmap: {final_score}/100\n\n"
        "Ordered roadmap (deterministic, do not change the numbers):\n"
        f"{steps}\n\n"
        "Return JSON: {\n"
        '  "summary": string,        // 2-3 sentences motivating this path\n'
        '  "strengths": [string],    // 2-3 quick wins from the roadmap\n'
        '  "improvements": [string]  // 2-3 longer-term moves\n'
        "}\n"
    )


# ---- Resume Reality Check explanation -------------------------------------
REALITY_SYSTEM = (
    "You are a technical recruiter explaining a 'Resume Reality Check' to a "
    "candidate. Each skill has an evidence level (Strong/Medium/Weak/Missing) and "
    "the Credibility Score were computed by a deterministic engine that compares "
    "resume claims against the candidate's actual public GitHub. These numbers are "
    "FINAL — do NOT change or recompute them. Explain plainly why claims are or "
    "aren't backed by evidence, and how to close the gaps (e.g. build/publish "
    "projects, add READMEs). Respond with ONLY a single valid JSON object."
)


def reality_user_prompt(
    credibility_score: int, counts: dict, evidence: list[dict]
) -> str:
    lines = []
    for e in evidence[:25]:
        why = "; ".join(e.get("signals", []))
        lines.append(f"- {e['skill']}: {e['level']} ({e['evidence_score']}/100). {why}")
    evidence_text = "\n".join(lines)
    return (
        f"Credibility Score (deterministic, do not change): {credibility_score}/100\n"
        f"Evidence counts: {counts}\n\n"
        "Per-skill evidence (resume claim vs GitHub):\n"
        f"{evidence_text}\n\n"
        "Return JSON: {\n"
        '  "summary": string,        // 2-3 sentences on overall resume credibility\n'
        '  "strengths": [string],    // 2-4 well-evidenced claims\n'
        '  "improvements": [string]  // 2-4 specific ways to back up weak/missing claims\n'
        "}\n"
    )


def score_user_prompt(role_label: str, hiring_score: int, breakdown: list[dict]) -> str:
    lines = []
    for c in breakdown:
        details = "; ".join(c.get("details", []))
        lines.append(
            f"- {c['label']}: {c['score']}/100 (weight {c['weight']}%). {details}"
        )
    breakdown_text = "\n".join(lines)
    return (
        f"Target role: {role_label}\n"
        f"Final Hiring Score (deterministic, do not change): {hiring_score}/100\n\n"
        "Category breakdown:\n"
        f"{breakdown_text}\n\n"
        "Return JSON: {\n"
        '  "summary": string,        // 2-3 sentences explaining the overall score\n'
        '  "strengths": [string],    // 2-4 concrete strengths\n'
        '  "improvements": [string]  // 2-4 specific, actionable next steps\n'
        "}\n"
    )
