"use client";

import { motion } from "framer-motion";
import {
  MapIcon,
  Loader2,
  RefreshCw,
  Clock,
  GraduationCap,
  Flag,
  Target,
} from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CareerRoadmap, RoadmapPhase } from "@/lib/types";

function PhaseNode({
  phase,
  index,
  isLast,
}: {
  phase: RoadmapPhase;
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="grid grid-cols-[auto_1fr] gap-4"
    >
      {/* Rail */}
      <div className="flex flex-col items-center">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-white shadow-lg shadow-brand/30">
          {index + 1}
        </span>
        {!isLast && (
          <span className="mt-1 w-px flex-1 bg-gradient-to-b from-brand/40 via-white/10 to-white/5" />
        )}
      </div>

      {/* Card */}
      <div className="surface surface-hover mb-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold leading-tight">{phase.name}</h4>
          {phase.duration && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted">
              <Clock className="h-3 w-3" /> {phase.duration}
            </span>
          )}
        </div>

        {phase.focus && (
          <p className="mt-2 text-sm text-foreground/90">{phase.focus}</p>
        )}

        {phase.skills?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Learn
            </p>
            <div className="flex flex-wrap gap-1.5">
              {phase.skills.map((s, i) => (
                <Badge key={i} className="border-brand/25 bg-brand/10">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {phase.project && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-gradient-to-br from-brand/15 to-transparent p-3 text-sm">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span className="text-foreground/90">
              <span className="font-medium">Build:</span> {phase.project}
            </span>
          </div>
        )}

        {phase.why && <p className="mt-3 text-xs text-muted">{phase.why}</p>}
      </div>
    </motion.li>
  );
}

export function RoadmapPanel({
  roadmap,
  onBuild,
  building,
}: {
  roadmap: CareerRoadmap | null;
  onBuild: () => void;
  building: boolean;
}) {
  const goal = roadmap?.career_goal || roadmap?.target_role_label;

  return (
    <Section
      eyebrow="Your journey"
      title="AI Career Roadmap"
      subtitle={
        roadmap ? `A phased plan toward ${goal}.` : "A phased learning plan toward your career goal."
      }
      action={
        roadmap ? (
          <Button variant="ghost" size="sm" onClick={onBuild} disabled={building}>
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Rebuild
          </Button>
        ) : null
      }
    >
      {!roadmap ? (
        <div className="surface flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand/30 to-brand-2/20">
            <MapIcon className="h-6 w-6 text-brand" />
          </span>
          <p className="max-w-sm text-sm text-muted">
            Get a goal-oriented learning plan — the skills you&apos;re missing and the
            projects to prove them, phase by phase.
          </p>
          <Button onClick={onBuild} disabled={building}>
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapIcon className="h-4 w-4" />}
            Build roadmap
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview band */}
          <div className="surface rounded-2xl p-5 sm:p-6">
            {goal && (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                <Target className="h-3.5 w-3.5 text-brand" />
                Goal: <span className="font-medium text-foreground">{goal}</span>
              </p>
            )}
            {roadmap.summary && (
              <p className="max-w-3xl text-sm leading-relaxed text-foreground/85">
                {roadmap.summary}
              </p>
            )}
            {roadmap.missing_skills?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                  Skills to gain ({roadmap.missing_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.missing_skills.map((s, i) => (
                    <Badge key={i}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Journey */}
          {roadmap.phases.length ? (
            <ol className="relative">
              {roadmap.phases.map((p, i) => (
                <PhaseNode
                  key={i}
                  phase={p}
                  index={i}
                  isLast={false}
                />
              ))}
              {/* Outcome */}
              <li className="grid grid-cols-[auto_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-400 text-black shadow-lg shadow-emerald-400/20">
                    <Flag className="h-4 w-4" />
                  </span>
                </div>
                <div className="surface flex items-center gap-2 rounded-2xl border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm font-medium">
                  <span>{goal ? `${goal} — ready` : "Career goal reached"}</span>
                </div>
              </li>
            </ol>
          ) : (
            <p className="text-sm text-muted">No phases generated. Try rebuilding.</p>
          )}
        </div>
      )}
    </Section>
  );
}
