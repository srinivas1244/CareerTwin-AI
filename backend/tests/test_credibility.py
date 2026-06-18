"""Deterministic Reality Check tests: fixed inputs -> fixed, hand-computed outputs."""
from app.domain.credibility import (
    LEVEL_MEDIUM,
    LEVEL_MISSING,
    LEVEL_STRONG,
    RepoEvidence,
    compute_credibility,
)


def _by_skill(result):
    return {e.skill: e.level for e in result.evidence}


def test_reality_check_mixed_evidence():
    skills = ["Python", "React", "AWS", "Node.js"]
    languages = {"Python": 2, "JavaScript": 1}
    repos = [
        RepoEvidence(
            name="data-tools",
            description="python data analysis",
            language="Python",
            topics=["python", "pandas"],
        ),
        RepoEvidence(
            name="portfolio",
            description="my portfolio built with react",
            language="JavaScript",
            topics=["react", "portfolio"],
        ),
    ]
    result = compute_credibility(skills, repos, languages)
    levels = _by_skill(result)

    # Python: lang(2 repos)=79 + topic=25 + desc=15 -> capped 100 -> Strong
    assert levels["Python"] == LEVEL_STRONG
    # React: topic(25) + desc(15) = 40 -> Medium
    assert levels["React"] == LEVEL_MEDIUM
    # AWS + Node.js: no evidence -> Missing
    assert levels["AWS"] == LEVEL_MISSING
    assert levels["Node.js"] == LEVEL_MISSING

    # credibility = mean(100, 40, 0, 0) = 35
    assert result.credibility_score == 35
    assert result.counts == {
        LEVEL_STRONG: 1,
        LEVEL_MEDIUM: 1,
        "Weak": 0,
        LEVEL_MISSING: 2,
    }


def test_reality_check_no_github_all_missing():
    result = compute_credibility(["Python", "SQL"], [], {})
    assert result.credibility_score == 0
    assert all(e.level == LEVEL_MISSING for e in result.evidence)
    assert result.counts[LEVEL_MISSING] == 2


def test_framework_suffix_variants_match():
    # "Node.js"/"React.js"/"Express.js" should match repos that say node/react/express
    repos = [
        RepoEvidence(
            name="node-api",
            description="express server",
            topics=["nodejs", "react"],
        )
    ]
    res = compute_credibility(["Node.js", "React.js", "Express.js"], repos, {})
    levels = {e.skill: e.level for e in res.evidence}
    assert levels["Node.js"] != LEVEL_MISSING
    assert levels["React.js"] != LEVEL_MISSING
    assert levels["Express.js"] != LEVEL_MISSING


def test_reality_check_dedupes_skills():
    result = compute_credibility(["Python", "python", "PYTHON"], [], {})
    assert len(result.evidence) == 1


def test_reality_check_determinism():
    skills = ["Python", "Docker"]
    repos = [RepoEvidence(name="api", description="docker service", topics=["docker"])]
    a = compute_credibility(skills, repos, {"Python": 1})
    b = compute_credibility(skills, repos, {"Python": 1})
    assert a.credibility_score == b.credibility_score
    assert _by_skill(a) == _by_skill(b)
