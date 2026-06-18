"use client";

import { Rocket, Loader2, RefreshCw, ArrowRight, ArrowUpRight, FlaskConical } from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import type { Simulation } from "@/lib/types";

export function SimulatorPanel({
  simulation,
  onRun,
  running,
}: {
  simulation: Simulation | null;
  onRun: () => void;
  running: boolean;
}) {
  if (!simulation) {
    // NextBestActions already exposes the generate CTA when there's no simulation.
    return null;
  }

  const gain = simulation.roadmap_final_score - simulation.base_score;
  const levers = [...simulation.scenarios].filter((s) => s.delta > 0);

  return (
    <Section
      eyebrow="Explore"
      title="Career Simulator"
      subtitle="See how each move changes your deterministic Hiring Score."
      action={
        <Button variant="ghost" size="sm" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Re-run
        </Button>
      }
    >
      <div className="surface rounded-2xl p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold tabular-nums">{simulation.base_score}</span>
          <ArrowRight className="h-5 w-5 text-muted" />
          <span className="text-3xl font-bold tabular-nums text-emerald-300">
            {simulation.roadmap_final_score}
          </span>
          {gain > 0 && (
            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-sm font-semibold text-emerald-300">
              +{gain}
            </span>
          )}
          <span className="text-xs text-muted">/ 100 projected</span>
        </div>

        {levers.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {levers.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="truncate text-sm text-foreground/90">{s.label}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  <span className="tabular-nums">→ {s.projected_score}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300">
                    <ArrowUpRight className="h-3 w-3" /> +{s.delta}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No further improvements available.</p>
        )}

        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted">
          <FlaskConical className="h-3.5 w-3.5 text-brand" />
          Interactive “What-If?” (combine moves) is coming next.
        </p>
      </div>
    </Section>
  );
}
