"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  LogOut,
  Target,
  Flag,
  Gauge,
  ShieldCheck,
  Sparkles,
  FolderGit2,
  Award,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/lib/useSession";
import { apiGet } from "@/lib/api";
import type { CareerProfile, HiringScore, RealityCheck } from "@/lib/types";

/** Avatar button in the navbar that opens a right-side profile drawer. */
export function ProfileMenu() {
  const { session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [score, setScore] = useState<HiringScore | null>(null);
  const [reality, setReality] = useState<RealityCheck | null>(null);

  const email = session?.user.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "U";

  useEffect(() => setMounted(true), []);

  // Lazily load profile + scores the first time the drawer opens.
  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    (async () => {
      try {
        setProfile(await apiGet<CareerProfile>("/api/career-profile"));
      } catch {
        /* no twin yet */
      }
      try {
        setScore(await apiGet<HiringScore>("/api/hiring-score"));
      } catch {
        /* no score yet */
      }
      try {
        setReality(await apiGet<RealityCheck>("/api/reality-check"));
      } catch {
        /* no reality check yet */
      }
    })();
  }, [open, loaded]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const skillsCount =
    (profile?.skills.length ?? 0) + (profile?.technologies.length ?? 0);

  const drawer = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <motion.aside
            data-theme="dark"
            className="fixed right-0 top-0 z-[61] flex h-screen w-[min(23rem,100vw)] flex-col border-l border-white/10 bg-[#0c0d12]/95 text-foreground shadow-2xl shadow-black/60 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-label="Profile"
          >
            {/* Header */}
            <div className="relative border-b border-white/5 bg-gradient-to-br from-brand/20 to-transparent p-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 pr-8">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-lg font-semibold text-white">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{email}</p>
                  <p className="text-xs text-muted">
                    {profile?.target_role_label
                      ? profile.target_role_label
                      : "Your account"}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Scores */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Scores
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat icon={Gauge} label="Hiring" value={score?.hiring_score} />
                  <Stat
                    icon={ShieldCheck}
                    label="Credibility"
                    value={reality?.credibility_score}
                  />
                </div>
              </div>

              {/* Snapshot */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Twin snapshot
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={Sparkles} label="Skills" value={skillsCount} />
                  <MiniStat
                    icon={FolderGit2}
                    label="Projects"
                    value={profile?.projects.length ?? 0}
                  />
                  <MiniStat
                    icon={Award}
                    label="Certs"
                    value={profile?.certifications.length ?? 0}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <InfoRow
                  icon={Target}
                  label="Target role"
                  value={profile?.target_role_label}
                />
                <InfoRow
                  icon={Flag}
                  label="Career goal"
                  value={profile?.career_goal}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-2 border-t border-white/5 p-4">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
                >
                  <LayoutDashboard className="h-4 w-4" /> Go to dashboard
                </button>
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground/90 transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open profile"
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-sm font-semibold text-white ring-2 ring-transparent transition hover:ring-white/20"
      >
        {initial}
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5">
        <Icon className="h-4 w-4 text-muted" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-foreground/90">{value || "—"}</p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value?: number | null;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <p className="flex items-center gap-1 text-xs text-muted">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? value : "—"}
        {typeof value === "number" && (
          <span className="text-xs font-normal text-muted"> /100</span>
        )}
      </p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted" />
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{label}</p>
    </div>
  );
}
