"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  GitBranch,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  ArrowRight,
} from "lucide-react";
import { apiUpload, apiPost, apiPatch } from "@/lib/api";
import type {
  ResumeUploadResult,
  GithubProfile,
  CareerProfile,
} from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfigBanner } from "@/components/ConfigBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = ["Resume", "GitHub", "Generate"];

function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-10 flex items-center justify-center">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={
                i === current
                  ? { boxShadow: ["0 0 0 0px rgba(124,108,255,0.4)", "0 0 0 6px rgba(124,108,255,0)", "0 0 0 0px rgba(124,108,255,0)"] }
                  : {}
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                i < current
                  ? "border-brand bg-brand text-white shadow-[0_0_18px_-4px_rgba(124,108,255,0.9)]"
                  : i === current
                  ? "border-brand text-brand shadow-[0_0_14px_-6px_rgba(124,108,255,0.7)]"
                  : "border-white/15 text-muted"
              )}
            >
              {i < current ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </motion.div>
            <span
              className={cn(
                "hidden text-xs sm:block transition-colors duration-300",
                i === current
                  ? "font-medium text-foreground"
                  : i < current
                  ? "text-brand/80"
                  : "text-muted"
              )}
            >
              {label}
            </span>
          </div>

          {/* Connecting line */}
          {i < STEPS.length - 1 && (
            <div className="relative mx-3 mb-6 h-px w-12 bg-white/8 sm:w-16">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-brand-2"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < current ? 1 : 0 }}
                style={{ originX: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [resume, setResume] = useState<ResumeUploadResult | null>(null);
  const [github, setGithub] = useState<GithubProfile | null>(null);
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [role, setRole] = useState("");

  async function handleResume(file: File) {
    setError(null);
    setBusy(true);
    try {
      const res = await apiUpload<ResumeUploadResult>("/api/resume", file);
      setResume(res);
      if (!res.has_text) {
        setError("We couldn't extract text from that file. Try another resume.");
      } else {
        setStep(1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGithub(skip = false) {
    setError(null);
    if (skip) {
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<GithubProfile>("/api/github", { username });
      setGithub(res);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyze that GitHub user.");
    } finally {
      setBusy(false);
    }
  }

  async function generateTwin() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiPost<CareerProfile>("/api/career-profile/generate");
      setProfile(res);
      setRole(res.target_role ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Twin generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setError(null);
    setBusy(true);
    try {
      if (profile && role && role !== profile.target_role) {
        await apiPatch("/api/career-profile/role", { target_role: role });
      }
      await apiPost("/api/hiring-score");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finalize. Try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <ConfigBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-5 sm:py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 shadow-lg shadow-brand/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Build your Career Twin
          </h1>
          <p className="mt-1 text-sm text-muted">
            Three quick steps to your employability profile.
          </p>
        </motion.div>

        <Stepper current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            {/* Step 0 — Resume */}
            {step === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Label className="mb-3 block">Upload your resume (PDF or DOCX)</Label>
                  <label
                    className={cn(
                      "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center transition-all duration-200",
                      "hover:border-brand/50 hover:bg-white/[0.06]",
                      busy && "pointer-events-none opacity-60"
                    )}
                  >
                    <motion.div
                      animate={busy ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      {busy ? (
                        <Loader2 className="h-8 w-8 text-muted" />
                      ) : resume ? (
                        <FileText className="h-8 w-8 text-emerald-300" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted transition-colors duration-200 group-hover:text-brand" />
                      )}
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium">
                        {resume ? resume.file_name : "Click to choose a file"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">PDF or DOCX · up to 5 MB</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleResume(f);
                      }}
                    />
                  </label>
                </CardContent>
              </Card>
            )}

            {/* Step 1 — GitHub */}
            {step === 1 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-white/5">
                      <GitBranch className="h-4 w-4 text-brand" />
                    </span>
                    <h2 className="font-semibold">Connect GitHub</h2>
                  </div>
                  <p className="text-sm text-muted">
                    Enter your GitHub username so we can analyze your public repos.
                    This is optional but strongly improves your score accuracy.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="gh">GitHub username</Label>
                    <Input
                      id="gh"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. torvalds"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && username.trim()) handleGithub(false);
                      }}
                    />
                  </div>
                  {github && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                    >
                      Analyzed @{github.username}: {github.repo_count} repos · strength {github.github_strength_score}/100
                    </motion.p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleGithub(false)}
                      disabled={busy || !username.trim()}
                      className="flex-1 btn-glow"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Analyze
                    </Button>
                    <Button variant="outline" onClick={() => handleGithub(true)} disabled={busy}>
                      Skip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2 — Generate */}
            {step === 2 && (
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/8 bg-gradient-to-br from-brand/30 to-brand-2/20">
                      <Sparkles className="h-4 w-4 text-brand" />
                    </span>
                    <h2 className="font-semibold">Generate your Career Twin</h2>
                  </div>

                  {!profile ? (
                    <>
                      <p className="text-sm text-muted">
                        We&apos;ll analyze your resume{github ? " and GitHub" : ""} to
                        extract your skills, projects, and best-fit role.
                      </p>
                      <Button
                        onClick={generateTwin}
                        disabled={busy}
                        className="w-full btn-glow"
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {busy ? "Generating…" : "Generate Career Twin"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                      >
                        Twin created — {profile.skills.length} skills, {profile.projects.length} projects detected.
                      </motion.p>
                      <div className="space-y-1.5">
                        <Label htmlFor="role">
                          Target role{" "}
                          <span className="text-muted">
                            (AI suggested: {profile.inferred_role || "—"})
                          </span>
                        </Label>
                        <select
                          id="role"
                          aria-label="Target role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="field flex h-11 w-full rounded-xl border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          {profile.role_options.map((r) => (
                            <option key={r.key} value={r.key} className="bg-background">
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button onClick={finish} disabled={busy} className="w-full btn-glow">
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        View my dashboard <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
          >
            {error}
          </motion.p>
        )}
      </main>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingInner />
    </AuthGuard>
  );
}
