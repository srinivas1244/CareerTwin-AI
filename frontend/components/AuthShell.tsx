"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  BarChart2,
  ShieldCheck,
  Map,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const FEATURES = [
  {
    icon: Brain,
    title: "Career Twin Profile",
    desc: "AI extracts your skills, projects, and experience from your resume and GitHub into a persistent intelligence profile.",
  },
  {
    icon: BarChart2,
    title: "Hiring Score Engine",
    desc: "A deterministic 0–100 score across Skills, Projects, GitHub activity, Certifications, and Resume quality — no guesswork.",
  },
  {
    icon: ShieldCheck,
    title: "Resume Reality Check",
    desc: "Every skill you claim is cross-checked against your actual GitHub commits. Know what's real, what's weak, what's missing.",
  },
  {
    icon: Map,
    title: "AI Career Roadmap",
    desc: "A phase-by-phase plan with exact skills to learn and projects to build, calibrated to your target role.",
  },
];

const SCORE_BARS = [
  { label: "Skills", pct: 82 },
  { label: "Projects", pct: 91 },
  { label: "GitHub", pct: 68 },
  { label: "Certs", pct: 47 },
  { label: "Resume", pct: 80 },
];

// ── Left brand panel ──────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div
      data-theme="dark"
      className="auth-brand-aura relative flex flex-col justify-between overflow-hidden bg-[#080810] px-10 py-10 text-foreground xl:px-14"
    >

      {/* Logo */}
      <Link href="/" className="relative flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 shadow-lg shadow-brand/30">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <span className="text-lg font-semibold tracking-tight">CareerTwin AI</span>
      </Link>

      {/* Headline + pitch */}
      <motion.div
        className="relative mt-14"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <h1 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
          Know exactly<br />
          <span className="bg-gradient-to-r from-brand via-brand-2 to-blue-400 bg-clip-text text-transparent">
            where you stand.
          </span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/60">
          Upload your resume, connect GitHub, and get a deterministic
          employability profile — scoring, skill gaps, and a roadmap all in one place.
        </p>
      </motion.div>

      {/* Feature list */}
      <motion.ul
        className="relative mt-10 space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
        }}
      >
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <motion.li
            key={title}
            variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
            className="flex gap-3"
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/5">
              <Icon className="h-4 w-4 text-brand" />
            </span>
            <div>
              <p className="text-sm font-medium leading-snug">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/50">{desc}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {/* Decorative score preview */}
      <motion.div
        className="relative mt-10 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <div className="mb-3 flex items-end gap-1.5">
          <span className="text-3xl font-bold tabular-nums leading-none">87</span>
          <span className="mb-0.5 text-sm text-foreground/40">/100 Hiring Score</span>
        </div>
        <div className="space-y-2">
          {SCORE_BARS.map(({ label, pct }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[11px] text-foreground/40">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.6 + SCORE_BARS.findIndex(b => b.label === label) * 0.06, ease: "easeOut" }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-foreground/40">
                {pct}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[10px] uppercase tracking-[0.14em] text-foreground/30">
          Sample profile preview
        </p>
      </motion.div>
    </div>
  );
}

// ── Shell wrapper ─────────────────────────────────────────────────────────────

export function AuthShell({ children }: { readonly children: React.ReactNode }) {
  return (
    <main className="relative flex flex-1">
      {/* Theme toggle — floats top-right on all auth pages */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Brand panel — desktop only */}
      <div className="hidden w-[52%] lg:grid xl:w-[55%]">
        <BrandPanel />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 lg:border-l lg:border-white/6">
        {/* Mobile logo (hidden on desktop where brand panel shows) */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold">CareerTwin AI</span>
        </Link>

        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}
