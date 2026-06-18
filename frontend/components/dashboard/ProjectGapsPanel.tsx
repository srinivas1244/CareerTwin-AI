"use client";

import { useState } from "react";
import {
  GitBranch,
  Loader2,
  RefreshCw,
  Clock,
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectGap, ProjectRecommendation } from "@/lib/types";

function difficultyStyle(d: string) {
  const k = d.toLowerCase();
  if (k.startsWith("beg")) return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
  if (k.startsWith("adv")) return "bg-red-400/10 text-red-300 border-red-400/20";
  return "bg-amber-400/10 text-amber-300 border-amber-400/20";
}

function coveredSkills(rec: ProjectRecommendation, missing: string[]): string[] {
  const pool = [...(rec.key_skills ?? []), ...(rec.tech_stack ?? [])].map((s) =>
    s.toLowerCase()
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of missing) {
    const ml = m.toLowerCase();
    if (pool.some((p) => p.includes(ml) || ml.includes(p)) && !seen.has(ml)) {
      seen.add(ml);
      out.push(m);
    }
  }
  return out.slice(0, 3);
}

function GapCard({
  rec,
  missing,
}: {
  rec: ProjectRecommendation;
  missing: string[];
}) {
  const [open, setOpen] = useState(false);
  const covers = coveredSkills(rec, missing);
  return (
    <div className="surface surface-hover flex flex-col rounded-2xl p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-semibold leading-tight">{rec.name}</h4>
        {rec.difficulty && (
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs", difficultyStyle(rec.difficulty))}>
            {rec.difficulty}
          </span>
        )}
      </div>
      {rec.timeline && (
        <p className="mb-3 flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3 w-3" /> {rec.timeline}
        </p>
      )}

      {/* Recommended because */}
      <div className="mb-3 space-y-1.5 rounded-xl bg-white/[0.03] p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          Recommended because
        </p>
        {covers.length > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-foreground/90">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            Covers missing skill{covers.length > 1 ? "s" : ""}:{" "}
            <span className="font-medium">{covers.join(", ")}</span>
          </p>
        )}
        {rec.why_it_matters && (
          <p className="flex items-start gap-1.5 text-xs text-foreground/90">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <span>{rec.why_it_matters}</span>
          </p>
        )}
      </div>

      {rec.tech_stack?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rec.tech_stack.slice(0, 6).map((t, i) => (
            <Badge key={i}>{t}</Badge>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 flex items-center gap-1 self-start text-xs font-medium text-brand transition hover:opacity-80"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Hide details" : "Show details"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3 text-sm">
          {rec.architecture && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
                <Layers className="h-3 w-3" /> Architecture
              </p>
              <p className="text-foreground/90">{rec.architecture}</p>
            </div>
          )}
          {rec.key_skills?.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Key skills learned
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rec.key_skills.map((s, i) => (
                  <Badge key={i}>{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectGapsPanel({
  gaps,
  missingSkills,
  onDetect,
  detecting,
  currentRole,
  currentRoleLabel,
}: {
  gaps: ProjectGap | null;
  missingSkills: string[];
  onDetect: () => void;
  detecting: boolean;
  currentRole?: string | null;
  currentRoleLabel?: string | null;
}) {
  const stale = !!gaps && !!currentRole && gaps.target_role !== currentRole;
  return (
    <Section
      eyebrow="Build next"
      title="Project Gap Detector"
      subtitle={
        gaps
          ? `Recommended projects for ${gaps.target_role_label}.`
          : "The portfolio projects you're missing for your target role."
      }
      action={
        gaps ? (
          <Button variant="ghost" size="sm" onClick={onDetect} disabled={detecting}>
            {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-detect
          </Button>
        ) : null
      }
    >
      {stale && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Computed for <span className="font-medium">{gaps?.target_role_label}</span>; your
          current target is <span className="font-medium">{currentRoleLabel}</span>. Re-detect
          to update.
        </div>
      )}

      {!gaps ? (
        <div className="surface flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/30 to-brand-2/20">
            <GitBranch className="h-5 w-5 text-brand" />
          </span>
          <p className="max-w-sm text-sm text-muted">
            Discover the projects to build next — each with why it matters,
            architecture, and the skills you&apos;ll gain.
          </p>
          <Button onClick={onDetect} disabled={detecting}>
            {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
            Detect project gaps
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {gaps.projects.map((rec, i) => (
            <GapCard key={i} rec={rec} missing={missingSkills} />
          ))}
        </div>
      )}
    </Section>
  );
}
