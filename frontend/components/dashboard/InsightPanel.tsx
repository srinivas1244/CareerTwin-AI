"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { Section } from "./Section";
import { TONE_TEXT, type Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

export function InsightPanel({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null;
  return (
    <Section eyebrow="AI" title="Career Twin Insight">
      <div className="grid gap-3 md:grid-cols-3">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="surface surface-hover relative overflow-hidden rounded-2xl p-5"
          >
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand/30 to-brand-2/20">
              <Brain className={cn("h-4 w-4", TONE_TEXT[ins.tone])} />
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{ins.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
