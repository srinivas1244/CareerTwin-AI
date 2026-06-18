"use client";

import { CheckCircle2, AlertTriangle, OctagonAlert, Eye } from "lucide-react";
import { Section } from "./Section";
import { cn } from "@/lib/utils";
import type { RecruiterView as RecruiterViewData } from "@/lib/insights";

function Column({
  title,
  items,
  empty,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  empty: string;
  icon: typeof CheckCircle2;
  tone: "emerald" | "amber" | "red";
}) {
  const toneText = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    red: "text-red-300",
  }[tone];
  return (
    <div className="surface rounded-2xl p-5">
      <p className={cn("mb-3 flex items-center gap-2 text-sm font-semibold", toneText)}>
        <Icon className="h-4 w-4" /> {title}
      </p>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90">
              <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", toneText)} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

export function RecruiterView({ view }: { view: RecruiterViewData }) {
  const has =
    view.strengths.length || view.weaknesses.length || view.redFlags.length;
  if (!has) return null;
  return (
    <Section
      eyebrow="Outside-in"
      title={
        <span className="inline-flex items-center gap-2">
          <Eye className="h-5 w-5 text-brand" /> Recruiter View
        </span>
      }
      subtitle="How a recruiter is likely to read your profile today."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Column
          title="Strengths"
          items={view.strengths}
          empty="Build evidence to surface strengths."
          icon={CheckCircle2}
          tone="emerald"
        />
        <Column
          title="Weaknesses"
          items={view.weaknesses}
          empty="No major weaknesses."
          icon={AlertTriangle}
          tone="amber"
        />
        <Column
          title="Red flags"
          items={view.redFlags}
          empty="None detected."
          icon={OctagonAlert}
          tone="red"
        />
      </div>
    </Section>
  );
}
