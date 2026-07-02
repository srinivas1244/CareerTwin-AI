// Pure, grounded derivations for the redesigned dashboard.
// No fabricated stats — everything here comes from the user's real, deterministic
// scores and analyses.
import type {
  HiringScore,
  CategoryScore,
  RealityCheck,
  ProjectGap,
  CareerProfile,
} from "./types";

export type Tone = "emerald" | "amber" | "red" | "brand" | "muted";

export const TONE_TEXT: Record<Tone, string> = {
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  red: "text-red-300",
  brand: "text-brand",
  muted: "text-muted",
};

export const TONE_SOFT: Record<Tone, string> = {
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  red: "bg-red-400/10 text-red-300 border-red-400/20",
  brand: "bg-brand/10 text-brand border-brand/20",
  muted: "bg-white/5 text-muted border-white/10",
};

export function displayName(email?: string | null): string {
  if (!email) return "there";
  const local = email.split("@")[0].replace(/[._\-+]+/g, " ").trim();
  if (!local) return "there";
  return local
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function twinStatus(score?: number | null): { label: string; tone: Tone } {
  const s = score ?? 0;
  if (s >= 85) return { label: "Job-ready", tone: "emerald" };
  if (s >= 70) return { label: "Strong", tone: "emerald" };
  if (s >= 50) return { label: "Growing", tone: "amber" };
  if (s > 0) return { label: "Emerging", tone: "amber" };
  return { label: "Getting started", tone: "muted" };
}

export function scoreTone(score: number): Tone {
  if (score >= 75) return "emerald";
  if (score >= 50) return "amber";
  return "red";
}

export function strengths(score?: HiringScore | null): CategoryScore[] {
  return [...(score?.breakdown ?? [])]
    .filter((c) => c.score >= 70)
    .sort((a, b) => b.score - a.score);
}

export function weaknesses(score?: HiringScore | null): CategoryScore[] {
  return [...(score?.breakdown ?? [])]
    .filter((c) => c.score < 60)
    .sort((a, b) => a.score - b.score);
}

export interface RecruiterView {
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
}

const STRENGTH_PHRASES: Record<string, string> = {
  projects: "Strong, role-relevant project portfolio",
  certifications: "Relevant certifications",
  skills: "Broad, role-aligned skill set",
  github: "Active GitHub presence",
  resume_quality: "Well-structured, complete resume",
};

const WEAKNESS_PHRASES: Record<string, string> = {
  projects: "Thin project portfolio for the target role",
  certifications: "Few or no relevant certifications",
  skills: "Skill set not yet aligned to the role",
  github: "Limited public GitHub footprint",
  resume_quality: "Resume is missing key sections",
};

/** "How a recruiter sees you" — synthesized from real scores + reality check. */
export function deriveRecruiterView(
  score?: HiringScore | null,
  reality?: RealityCheck | null,
  profile?: CareerProfile | null
): RecruiterView {
  const breakdown = score?.breakdown ?? [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const redFlags: string[] = [];

  for (const c of [...breakdown].sort((a, b) => b.score - a.score)) {
    if (c.score >= 70 && STRENGTH_PHRASES[c.key]) strengths.push(STRENGTH_PHRASES[c.key]);
  }
  for (const c of [...breakdown].sort((a, b) => a.score - b.score)) {
    if (c.score < 55 && WEAKNESS_PHRASES[c.key]) weaknesses.push(WEAKNESS_PHRASES[c.key]);
  }

  const github = breakdown.find((c) => c.key === "github");
  if (github && github.score < 45) {
    redFlags.push("Weak GitHub evidence behind claimed skills");
  }
  if (reality) {
    const missing = reality.counts?.["Missing"] ?? 0;
    const backed = (reality.counts?.["Strong"] ?? 0) + (reality.counts?.["Medium"] ?? 0);
    if (missing > backed && missing > 0) {
      redFlags.push("Most resume claims aren't backed by public work");
    }
    if (reality.credibility_score < 40) {
      redFlags.push(`Low resume credibility (${reality.credibility_score}/100)`);
    }
  }
  if ((profile?.projects?.length ?? 0) === 0) {
    redFlags.push("No portfolio projects detected");
  }

  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    redFlags: redFlags.slice(0, 3),
  };
}
