"use client";

import { motion } from "framer-motion";
import { Flag, MapPin } from "lucide-react";
import { Section } from "./Section";
import { cn } from "@/lib/utils";
import type { Simulation } from "@/lib/types";

function ScoreChip({ value, delta }: { value: number; delta?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
      <span className="tabular-nums font-semibold">{value}</span>
      {typeof delta === "number" && delta > 0 && (
        <span className="text-emerald-300">+{delta}</span>
      )}
    </span>
  );
}

export function CareerTimeline({
  simulation,
  roleLabel,
}: {
  simulation: Simulation | null;
  roleLabel?: string | null;
}) {
  if (!simulation || !simulation.roadmap.length) return null;

  const final = simulation.roadmap_final_score;
  const ready = final >= 85;

  return (
    <Section
      eyebrow="Trajectory"
      title="Career Timeline"
      subtitle="Your projected path from today to role-ready."
    >
      <div className="surface rounded-2xl p-6 sm:p-7">
        <ol className="relative ml-1 space-y-5 border-l border-white/10 pl-6">
          {/* Today */}
          <li className="relative">
            <span className="absolute -left-[1.7rem] top-0.5 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-background">
              <MapPin className="h-3 w-3 text-muted" />
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Today</span>
              <ScoreChip value={simulation.base_score} />
            </div>
          </li>

          {/* Steps */}
          {simulation.roadmap.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="relative"
            >
              <span className="absolute -left-[1.72rem] top-1 grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground/90">{step.label}</span>
                <ScoreChip value={step.projected_score} delta={step.delta} />
              </div>
            </motion.li>
          ))}

          {/* Outcome */}
          <li className="relative">
            <span
              className={cn(
                "absolute -left-[1.72rem] top-0.5 grid h-5 w-5 place-items-center rounded-full",
                ready ? "bg-emerald-400 text-black" : "bg-white/15 text-foreground"
              )}
            >
              <Flag className="h-3 w-3" />
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">
                {ready ? `${roleLabel || "Role"}-ready` : "Projected readiness"}
              </span>
              <ScoreChip value={final} />
            </div>
          </li>
        </ol>
      </div>
    </Section>
  );
}
