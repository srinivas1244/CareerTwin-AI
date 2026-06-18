"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ScoreRing";
import { twinStatus, displayName, TONE_SOFT } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { HiringScore } from "@/lib/types";

function ScoreGlowRing({ score }: { score: number }) {
  const color =
    score >= 75 ? "rgba(74,222,128,0.22)" : score >= 50 ? "rgba(250,204,21,0.20)" : "rgba(248,113,113,0.20)";
  const ringColor =
    score >= 75 ? "rgba(74,222,128,0.45)" : score >= 50 ? "rgba(250,204,21,0.40)" : "rgba(248,113,113,0.40)";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Ring border glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 198,
          height: 198,
          border: `1px solid ${ringColor}`,
          boxShadow: `0 0 20px -4px ${ringColor}`,
        }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <ScoreRing score={score} size={184} label="Hiring readiness" />
    </div>
  );
}

export function CareerHero({
  email,
  roleLabel,
  score,
  summary,
  onImprove,
  onGenerateRoadmap,
  generatingRoadmap,
}: {
  email?: string | null;
  roleLabel?: string | null;
  score: HiringScore | null;
  summary?: string | null;
  onImprove: () => void;
  onGenerateRoadmap: () => void;
  generatingRoadmap: boolean;
}) {
  const name = displayName(email);
  const readiness = score?.hiring_score ?? null;
  const status = twinStatus(readiness);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="surface hero-aura relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10"
    >
      {/* Decorative spinning ring — background accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-white/[0.04] animate-spin-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-[300px] w-[300px] rounded-full border border-white/[0.03] animate-spin-slow-r"
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Text side */}
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" /> Your Career Twin
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          >
            Welcome back, <span className="text-gradient">{name}</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="mt-4 flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="text-muted">Target role</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium">
              {roleLabel || "Not set"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                TONE_SOFT[status.tone]
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          </motion.div>

          {summary && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-foreground/80"
            >
              {summary}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.38 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={onImprove} className="w-full sm:w-auto btn-glow">
              <Wand2 className="h-4 w-4" /> Improve my profile
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onGenerateRoadmap}
              disabled={generatingRoadmap}
              className="w-full sm:w-auto"
            >
              {generatingRoadmap ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Generate roadmap
            </Button>
          </motion.div>
        </div>

        {/* Score ring side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.34, 1.2, 0.64, 1] as [number, number, number, number] }}
          className="flex shrink-0 items-center justify-center self-center"
        >
          {readiness !== null ? (
            <ScoreGlowRing score={readiness} />
          ) : (
            <div className="grid h-44 w-44 place-items-center rounded-full border border-dashed border-white/15 px-6 text-center text-sm text-muted">
              Run analysis to see your readiness
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
