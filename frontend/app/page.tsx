"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Gauge,
  FileSearch,
  GitBranch,
  TrendingUp,
  Map,
  Upload,
  BarChart3,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const FEATURES = [
  {
    icon: Brain,
    title: "Career Twin Profile",
    desc: "A persistent intelligence profile built from your resume + GitHub — skills, projects, and experience all structured automatically.",
    live: true,
    accent: "from-brand/25 to-brand-2/15",
  },
  {
    icon: Gauge,
    title: "Hiring Score Engine",
    desc: "A deterministic 0–100 employability score across Skills, Projects, GitHub, Certifications, and Resume quality — no AI guesswork.",
    live: true,
    accent: "from-emerald-500/20 to-brand/15",
  },
  {
    icon: Map,
    title: "AI Career Roadmap",
    desc: "A phase-by-phase plan with exact skills to learn and projects to build, calibrated to your target role.",
    live: true,
    accent: "from-brand-2/20 to-emerald-500/12",
  },
  {
    icon: FileSearch,
    title: "Resume Reality Check",
    desc: "Every skill you claim is cross-checked against your actual GitHub commits. Weak, strong, or missing — you'll know.",
    live: false,
    accent: "from-amber-500/18 to-orange-500/12",
  },
  {
    icon: GitBranch,
    title: "Project Gap Detector",
    desc: "Find exactly which portfolio projects you're missing for your target role, with full specs, timelines, and tech stacks.",
    live: false,
    accent: "from-blue-500/18 to-brand-2/15",
  },
  {
    icon: TrendingUp,
    title: "Career Simulator",
    desc: "See how learning a skill or shipping a project moves your hiring score — before you invest the time.",
    live: false,
    accent: "from-purple-500/18 to-brand/15",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Upload,
    title: "Upload your resume",
    desc: "PDF or DOCX — we extract skills, projects, certifications, and experience automatically.",
  },
  {
    num: "02",
    icon: GitBranch,
    title: "Connect GitHub",
    desc: "Enter your public username. We analyze repos, languages, activity, and commit patterns.",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Get your score",
    desc: "Instant deterministic hiring score with a full breakdown and an AI-generated career roadmap.",
  },
];

const SCORE_BARS = [
  { label: "Skills",    pct: 82, color: "from-brand to-brand-2" },
  { label: "Projects",  pct: 91, color: "from-emerald-400 to-brand" },
  { label: "GitHub",    pct: 68, color: "from-brand-2 to-blue-400" },
  { label: "Certs",     pct: 47, color: "from-amber-400 to-orange-400" },
  { label: "Resume",    pct: 80, color: "from-brand to-purple-400" },
];

export default function Home() {
  const prefersReduced = useReducedMotion();

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: EASE },
  });

  const inView = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReduced ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, delay, ease: EASE },
  });

  return (
    <>
      <Navbar />

      <main className="relative flex-1">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-6xl px-5 pt-20 pb-14 text-center sm:pt-32 sm:pb-20">

          {/* Badge */}
          <motion.div {...fadeUp(0.05)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-muted backdrop-blur-sm mb-7">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            Resume + GitHub intelligence, scored deterministically
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.12)}
            className="mx-auto max-w-4xl text-balance text-5xl font-bold leading-[1.07] tracking-tight sm:text-6xl lg:text-[72px]"
          >
            Know how{" "}
            <span className="relative inline-block">
              <span className="text-gradient">employable</span>
              <motion.span
                className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-brand via-brand-2 to-transparent"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.75, delay: 0.6, ease: "easeOut" }}
              />
            </span>{" "}
            you really are.
          </motion.h1>

          {/* Sub */}
          <motion.p
            {...fadeUp(0.22)}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted"
          >
            CareerTwin builds a digital twin of your career from your resume and
            GitHub, then scores your real employability — with a roadmap to close
            every gap.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.3)}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 btn-glow">
                Build my Career Twin <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </motion.div>

          {/* Sample score card */}
          <motion.div
            {...fadeUp(0.48)}
            className="mx-auto mt-16 max-w-xs sm:max-w-sm"
          >
            <div className="surface glow-brand rounded-2xl p-5 text-left">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
                  Sample profile
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  Strong Candidate
                </span>
              </div>
              <div className="mb-4 flex items-end gap-1.5">
                <span className="text-4xl font-bold tabular-nums leading-none">87</span>
                <span className="mb-0.5 text-sm text-muted">/100 Hiring Score</span>
              </div>
              <div className="space-y-2.5">
                {SCORE_BARS.map(({ label, pct, color }, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs text-muted">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.75,
                          delay: 0.7 + i * 0.08,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted">
                      {pct}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted/50">
                Deterministic · no AI scoring
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── How it works ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <motion.div {...inView(0)} className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
              How it works
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Three steps to your career score
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <motion.div key={num} {...inView(i * 0.1)}>
                <div className="surface surface-hover rounded-2xl p-6 h-full">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5">
                      <Icon className="h-4.5 w-4.5 text-brand" />
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-gradient-brand">
                      {num}
                    </span>
                  </div>
                  <p className="font-semibold leading-snug">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-32">
          <motion.div {...inView(0)} className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
              Features
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to get hired
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              A full intelligence stack — not just a resume parser.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...inView((i % 3) * 0.08)}
                className="h-full"
              >
                <div className="glass glass-hover h-full rounded-2xl p-6">
                  <div
                    className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${f.accent}`}
                  >
                    <f.icon className="h-5 w-5 text-foreground/90" />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold leading-snug">{f.title}</h3>
                    <span
                      className={
                        f.live
                          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                          : "rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted"
                      }
                    >
                      {f.live ? "Live" : "Soon"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA strip */}
          <motion.div {...inView(0.1)} className="mt-14 text-center">
            <p className="mb-5 text-sm text-muted">
              Free forever. No credit card required.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2 btn-glow">
                <Sparkles className="h-4 w-4" />
                Get started free
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>
    </>
  );
}
