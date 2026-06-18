"use client";

import { Gauge, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Section } from "./Section";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { scoreTone, TONE_SOFT } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { HiringScore, CategoryScore } from "@/lib/types";

function CatChip({ c }: { c: CategoryScore }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
        TONE_SOFT[scoreTone(c.score)]
      )}
    >
      <span className="text-foreground/90">{c.label}</span>
      <span className="tabular-nums font-semibold">{c.score}</span>
    </div>
  );
}

export function HiringScorePanel({
  score,
  roleLabel,
  onCompute,
  computing,
}: {
  score: HiringScore | null;
  roleLabel?: string | null;
  onCompute: () => void;
  computing: boolean;
}) {
  return (
    <Section eyebrow="Readiness" title="Hiring Score">
      {!score ? (
        <div className="surface flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <p className="max-w-sm text-sm text-muted">
            Compute your deterministic employability score for {roleLabel || "your role"}.
          </p>
          <Button onClick={onCompute} disabled={computing}>
            {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
            Compute score
          </Button>
        </div>
      ) : (
        <div className="surface grid gap-6 rounded-2xl p-6 lg:grid-cols-[auto_1fr] lg:gap-8 lg:p-8">
          <div className="flex items-center justify-center">
            <ScoreRing score={score.hiring_score} size={168} label="out of 100" />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-300" /> Strengths
                </p>
                <div className="space-y-2">
                  {[...score.breakdown].sort((a, b) => b.score - a.score).slice(0, 2).map((c) => (
                    <CatChip key={c.key} c={c} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                  <TrendingDown className="h-3.5 w-3.5 text-red-300" /> Needs work
                </p>
                <div className="space-y-2">
                  {[...score.breakdown].sort((a, b) => a.score - b.score).slice(0, 2).map((c) => (
                    <CatChip key={c.key} c={c} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                Role match
              </p>
              <div className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-foreground/90">
                  {score.role_label || roleLabel || "Target role"}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                    style={{ width: `${score.hiring_score}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {score.hiring_score}%
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Multi-role comparison is coming soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
