"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import { askCareerTwin } from "@/lib/chatBus";
import type { Simulation } from "@/lib/types";

export function NextBestActions({
  simulation,
  onGenerate,
  generating,
}: {
  simulation: Simulation | null;
  onGenerate: () => void;
  generating: boolean;
}) {
  const actions = (simulation?.scenarios ?? []).filter((s) => s.delta > 0).slice(0, 3);

  return (
    <Section
      eyebrow="Do this next"
      title="Next Best Actions"
      subtitle="The highest-impact moves for your Hiring Score, ranked."
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
      ) : actions.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {actions.map((a, i) => (
            <motion.button
              key={i}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              onClick={() =>
                askCareerTwin(
                  `How do I "${a.label}" for my target role, and how much will it raise my Hiring Score?`
                )
              }
              className="surface surface-hover group flex flex-col rounded-2xl p-5 text-left"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <ArrowUpRight className="h-3 w-3" /> +{a.delta}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{a.label}</p>
              <p className="mt-1 text-xs text-muted">
                Projected score {a.projected_score}/100
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand opacity-70 transition group-hover:opacity-100">
                Ask how <ArrowUpRight className="h-3 w-3" />
              </span>
            </motion.button>
          ))}
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
