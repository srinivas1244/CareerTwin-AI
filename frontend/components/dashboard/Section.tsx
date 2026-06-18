"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

interface SectionProps {
  readonly eyebrow?: string;
  readonly title?: React.ReactNode;
  readonly subtitle?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly delay?: number;
}

export function Section({
  eyebrow,
  title,
  subtitle,
  action,
  className,
  children,
  delay = 0,
}: SectionProps) {
  return (
    <motion.section
      className={cn("scroll-mt-24", className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-56px" }}
      transition={{ duration: 0.42, delay, ease: EASE }}
    >
      {(eyebrow || title || action) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}
