"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, CheckCircle2, Flag } from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import { askCareerTwin } from "@/lib/chatBus";
import { cn } from "@/lib/utils";
import type { Simulation } from "@/lib/types";

function ScoreChip({ value, delta }: { value: number; delta?: number }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1 text-sm tabular-nums">
      <span className="font-semibold text-foreground">{value}</span>
      {typeof delta === "number" && delta > 0 && (
        <span className="text-xs text-emerald-300">+{delta}</span>
      )}
    </span>
  );
}

export function NextBestActions({
  simulation,
  roleLabel,
  onGenerate,
  generating,
}: {
  simulation: Simulation | null;
  roleLabel?: string | null;
  onGenerate: () => void;
  generating: boolean;
}) {
  const steps = simulation?.roadmap ?? [];
  const final = simulation?.roadmap_final_score ?? 0;
  const ready = final >= 85;

  return (
    <Section
      eyebrow="Do this next"
      title="Next Best Actions"
      subtitle="Your ranked path to a role-ready Hiring Score."
    >
      {!simulation ? (
        <div className="surface flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand/30 to-brand-2/20">
            <Zap className="h-5 w-5 text-brand" />
          </span>
          <p className="max-w-sm text-sm text-muted">
            Generate your personalized action plan — we&apos;ll compute the exact
            score impact of each move.
          </p>
          <Button onClick={onGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Generate action plan
          </Button>
        </div>
      ) : steps.length ? (
        <div className="surface divide-y divide-white/6 rounded-2xl">
          {steps.map((step, i) => (
            <motion.button
              key={i}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              onClick={() =>
                askCareerTwin(
                  `How do I "${step.label}" for my target role, and how much will it raise my Hiring Score?`
                )
              }
              className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/4"
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  i === 0
                    ? "bg-gradient-to-br from-brand to-brand-2 text-white"
                    : "bg-white/8 text-muted"
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
                {step.label}
              </span>
              <ScoreChip value={step.projected_score} delta={step.delta} />
            </motion.button>
          ))}

          {/* Outcome */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                ready ? "bg-emerald-400 text-black" : "bg-white/8 text-muted"
              )}
            >
              <Flag className="h-3 w-3" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {ready ? `${roleLabel || "Role"}-ready` : "Projected readiness"}
            </span>
            <ScoreChip value={final} />
          </div>
        </div>
      ) : (
        <div className="surface flex items-center gap-3 rounded-2xl p-6 text-sm text-muted">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          You&apos;re in great shape — no high-impact gaps remain for this role.
        </div>
      )}
    </Section>
  );
}
