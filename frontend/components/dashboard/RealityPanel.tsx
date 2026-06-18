"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { scoreTone, TONE_TEXT } from "@/lib/insights";
import type { RealityCheck, SkillEvidenceItem, EvidenceLevel } from "@/lib/types";

const LEVEL_STYLES: Record<EvidenceLevel, string> = {
  Strong: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  Medium: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  Weak: "bg-orange-400/10 text-orange-300 border-orange-400/20",
  Missing: "bg-red-400/10 text-red-300 border-red-400/20",
};

function Group({
  title,
  items,
  className,
}: {
  title: string;
  items: SkillEvidenceItem[];
  className: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {title} <span className="text-foreground/60">{items.length}</span>
      </p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 6).map((it, i) => (
            <span
              key={i}
              className={cn("rounded-full border px-2.5 py-1 text-xs", className)}
            >
              {it.skill}
            </span>
          ))}
          {items.length > 6 && (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted">
              +{items.length - 6}
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">None</p>
      )}
    </div>
  );
}

export function RealityPanel({
  reality,
  onRun,
  running,
}: {
  reality: RealityCheck | null;
  onRun: () => void;
  running: boolean;
}) {
  const [full, setFull] = useState(false);

  const strong = (reality?.evidence ?? []).filter((e) => e.level === "Strong");
  const weak = (reality?.evidence ?? []).filter(
    (e) => e.level === "Medium" || e.level === "Weak"
  );
  const missing = (reality?.evidence ?? []).filter((e) => e.level === "Missing");

  return (
    <Section
      eyebrow="Credibility"
      title="Resume Reality Check"
      subtitle="Your resume claims vs. real GitHub evidence."
      action={
        reality ? (
          <Button variant="ghost" size="sm" onClick={onRun} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Re-run
          </Button>
        ) : null
      }
    >
      {!reality ? (
        <div className="surface flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <p className="max-w-sm text-sm text-muted">
            Verify every claimed skill against your public GitHub. Needs a connected
            GitHub account.
          </p>
          <Button onClick={onRun} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Run Reality Check
          </Button>
        </div>
      ) : (
        <div className="surface rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <span
              className={cn(
                "text-3xl font-bold tabular-nums",
                TONE_TEXT[scoreTone(reality.credibility_score)]
              )}
            >
              {reality.credibility_score}
            </span>
            <div>
              <p className="text-sm font-medium">Credibility score</p>
              <p className="text-xs text-muted">
                {strong.length} strong · {weak.length} weak · {missing.length} missing
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Group title="Strong evidence" items={strong} className={LEVEL_STYLES.Strong} />
            <Group title="Weak evidence" items={weak} className={LEVEL_STYLES.Weak} />
            <Group title="Missing evidence" items={missing} className={LEVEL_STYLES.Missing} />
          </div>

          <button
            type="button"
            onClick={() => setFull(true)}
            className="mt-5 text-sm font-medium text-brand transition hover:opacity-80"
          >
            View full analysis →
          </button>
        </div>
      )}

      <Modal
        open={full}
        onClose={() => setFull(false)}
        title="Resume Reality Check"
        description={
          reality ? `Credibility ${reality.credibility_score}/100` : undefined
        }
      >
        <div className="space-y-2">
          {(reality?.evidence ?? []).map((it, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/5 bg-white/5 px-3 py-2"
              title={it.signals.join(" · ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm text-foreground/90">{it.skill}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    LEVEL_STYLES[it.level]
                  )}
                >
                  {it.level}
                </span>
              </div>
              {it.signals.length > 0 && (
                <p className="mt-1 text-xs text-muted">{it.signals[0]}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </Section>
  );
}
