"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Upload,
  FileText,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiUpload, ApiError } from "@/lib/api";
import type {
  CareerProfile,
  HiringScore,
  RealityCheck,
  ProjectGap,
  Simulation,
  CareerRoadmap,
  ResumeUploadResult,
  GithubProfile,
} from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfigBanner } from "@/components/ConfigBanner";
import { PageScene } from "@/components/PageScene";
import { useSession } from "@/lib/useSession";
import { ChatWidget } from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { deriveInsights } from "@/lib/insights";

import { CareerHero } from "@/components/dashboard/CareerHero";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { HiringScorePanel } from "@/components/dashboard/HiringScorePanel";
import { NextBestActions } from "@/components/dashboard/NextBestActions";
import { CareerTimeline } from "@/components/dashboard/CareerTimeline";
import { RealityPanel } from "@/components/dashboard/RealityPanel";
import { ProjectGapsPanel } from "@/components/dashboard/ProjectGapsPanel";
import { RoadmapPanel } from "@/components/dashboard/RoadmapPanel";
import { TwinOverview } from "@/components/dashboard/TwinOverview";

function DashboardInner() {
  const { session } = useSession();
  const email = session?.user?.email;
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [score, setScore] = useState<HiringScore | null>(null);
  const [reality, setReality] = useState<RealityCheck | null>(null);
  const [gaps, setGaps] = useState<ProjectGap | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [github, setGithub] = useState<GithubProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [noTwin, setNoTwin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [computing, setComputing] = useState(false);
  const [checkingReality, setCheckingReality] = useState(false);
  const [detectingGaps, setDetectingGaps] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [buildingRoadmap, setBuildingRoadmap] = useState(false);

  // Update & recompute modal
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleTouched, setRoleTouched] = useState(false);
  const [newResume, setNewResume] = useState<File | null>(null);
  const [ghUsername, setGhUsername] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await apiGet<CareerProfile>("/api/career-profile");
      setProfile(p);
      const tolerate = async <T,>(path: string, set: (v: T) => void) => {
        try {
          set(await apiGet<T>(path));
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 404)) throw e;
        }
      };
      await tolerate<GithubProfile>("/api/github", setGithub);
      await tolerate<HiringScore>("/api/hiring-score", setScore);
      await tolerate<RealityCheck>("/api/reality-check", setReality);
      await tolerate<ProjectGap>("/api/project-gaps", setGaps);
      await tolerate<Simulation>("/api/simulator", setSimulation);
      await tolerate<CareerRoadmap>("/api/roadmap", setRoadmap);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNoTwin(true);
      else setError(e instanceof Error ? e.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function recompute() {
    setComputing(true);
    setError(null);
    try {
      setScore(await apiPost<HiringScore>("/api/hiring-score"));
      runRealityCheck();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compute score.");
    } finally {
      setComputing(false);
    }
  }

  async function runRealityCheck() {
    setCheckingReality(true);
    try {
      setReality(await apiPost<RealityCheck>("/api/reality-check"));
    } catch {
      /* needs GitHub */
    } finally {
      setCheckingReality(false);
    }
  }

  async function detectGaps() {
    setDetectingGaps(true);
    setError(null);
    try {
      setGaps(await apiPost<ProjectGap>("/api/project-gaps"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not detect project gaps.");
    } finally {
      setDetectingGaps(false);
    }
  }

  async function runSimulation() {
    setSimulating(true);
    setError(null);
    try {
      setSimulation(await apiPost<Simulation>("/api/simulator"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run the simulator.");
    } finally {
      setSimulating(false);
    }
  }

  async function buildRoadmap() {
    setBuildingRoadmap(true);
    setError(null);
    try {
      setRoadmap(await apiPost<CareerRoadmap>("/api/roadmap"));
      // The roadmap renders at the bottom — bring it into view so the user
      // sees the result of "Generate roadmap".
      setTimeout(
        () =>
          document
            .getElementById("career-roadmap")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the roadmap.");
    } finally {
      setBuildingRoadmap(false);
    }
  }

  function openUpdate() {
    setSelectedRole(profile?.target_role ?? "");
    setRoleTouched(false);
    setNewResume(null);
    setGhUsername("");
    setUpdateError(null);
    setUpdateStep(null);
    setShowUpdate(true);
  }

  async function applyUpdates() {
    setUpdating(true);
    setUpdateError(null);
    try {
      let regenerated = false;
      if (newResume) {
        setUpdateStep("Uploading resume…");
        const res = await apiUpload<ResumeUploadResult>("/api/resume", newResume);
        if (!res.has_text) throw new Error("Couldn't read that resume. Try another PDF/DOCX.");
        regenerated = true;
      }
      if (ghUsername.trim()) {
        setUpdateStep("Analyzing GitHub…");
        setGithub(await apiPost<GithubProfile>("/api/github", { username: ghUsername.trim() }));
        regenerated = true;
      }
      let current = profile;
      if (regenerated) {
        setUpdateStep("Regenerating Career Twin…");
        current = await apiPost<CareerProfile>("/api/career-profile/generate");
        setProfile(current);
      }
      const desiredRole = roleTouched ? selectedRole : null;
      if (desiredRole && desiredRole !== current?.target_role) {
        setUpdateStep("Updating target role…");
        setProfile(await apiPatch<CareerProfile>("/api/career-profile/role", { target_role: desiredRole }));
      }
      setUpdateStep("Recomputing score…");
      setScore(await apiPost<HiringScore>("/api/hiring-score"));
      setUpdateStep("Running Reality Check…");
      try {
        setReality(await apiPost<RealityCheck>("/api/reality-check"));
      } catch {
        /* needs GitHub */
      }
      if (gaps) {
        setUpdateStep("Refreshing project gaps…");
        try {
          setGaps(await apiPost<ProjectGap>("/api/project-gaps"));
        } catch {
          /* ignore */
        }
      }
      if (simulation) {
        setUpdateStep("Re-running simulator…");
        try {
          setSimulation(await apiPost<Simulation>("/api/simulator"));
        } catch {
          /* ignore */
        }
      }
      if (roadmap) {
        setUpdateStep("Rebuilding roadmap…");
        try {
          setRoadmap(await apiPost<CareerRoadmap>("/api/roadmap"));
        } catch {
          /* ignore */
        }
      }
      setShowUpdate(false);
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : "Update failed. Try again.");
    } finally {
      setUpdating(false);
      setUpdateStep(null);
    }
  }

  if (loading) return <DashboardSkeleton />;

  if (noTwin) {
    return (
      <main className="mx-auto grid max-w-md flex-1 place-items-center px-5 py-24">
        <Card className="w-full text-center">
          <CardContent className="pt-8">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="mb-1 text-xl font-semibold">No Career Twin yet</h1>
            <p className="mb-6 text-sm text-muted">
              Upload your resume and connect GitHub to generate your profile.
            </p>
            <Link href="/onboarding">
              <Button>
                Start onboarding <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const roleLabel = profile?.target_role_label;
  const heroSummary =
    score?.explanation?.summary ||
    profile?.summary ||
    "Generate your analyses below to see exactly where you stand — and what to do next.";
  const insights = deriveInsights(score, reality, simulation, roleLabel);
  const missingSkills =
    roadmap?.missing_skills?.length
      ? roadmap.missing_skills
      : (reality?.evidence ?? [])
          .filter((e) => e.level === "Missing")
          .map((e) => e.skill);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-8 sm:px-5 sm:py-10">
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <CareerHero
        email={email}
        roleLabel={roleLabel}
        score={score}
        summary={heroSummary}
        onImprove={openUpdate}
        onGenerateRoadmap={buildRoadmap}
        generatingRoadmap={buildingRoadmap}
      />

      <InsightPanel insights={insights} />

      <HiringScorePanel
        score={score}
        roleLabel={roleLabel}
        onCompute={recompute}
        computing={computing}
      />

      {profile && <TwinOverview profile={profile} github={github} />}

      <NextBestActions
        simulation={simulation}
        onGenerate={runSimulation}
        generating={simulating}
      />

      <CareerTimeline simulation={simulation} roleLabel={roleLabel} />

      <RealityPanel reality={reality} onRun={runRealityCheck} running={checkingReality} />

      <ProjectGapsPanel
        gaps={gaps}
        missingSkills={missingSkills}
        onDetect={detectGaps}
        detecting={detectingGaps}
        currentRole={profile?.target_role}
        currentRoleLabel={roleLabel}
      />

      <div id="career-roadmap" className="scroll-mt-24">
        <RoadmapPanel roadmap={roadmap} onBuild={buildRoadmap} building={buildingRoadmap} />
      </div>

      {/* Update & recompute modal */}
      <Modal
        open={showUpdate}
        onClose={() => !updating && setShowUpdate(false)}
        title="Improve my profile"
        description="Change your target role, swap in a new resume, or update GitHub. Leave a field blank to keep it unchanged."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="update-role">Target role</Label>
            <select
              id="update-role"
              aria-label="Target role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setRoleTouched(true);
              }}
              className="field flex h-11 w-full rounded-xl border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {(profile?.role_options ?? []).map((r) => (
                <option key={r.key} value={r.key} className="bg-background">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>New resume (optional)</Label>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:border-brand/40",
                updating && "pointer-events-none opacity-60"
              )}
            >
              {newResume ? (
                <FileText className="h-4 w-4 text-emerald-300" />
              ) : (
                <Upload className="h-4 w-4 text-muted" />
              )}
              <span className={newResume ? "text-foreground" : "text-muted"}>
                {newResume ? newResume.name : "Choose a PDF or DOCX"}
              </span>
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                disabled={updating}
                onChange={(e) => setNewResume(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="update-gh">GitHub username (optional)</Label>
            <Input
              id="update-gh"
              value={ghUsername}
              onChange={(e) => setGhUsername(e.target.value)}
              placeholder="e.g. torvalds"
              disabled={updating}
            />
          </div>

          {(newResume || ghUsername.trim()) && (
            <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-muted">
              Changing your resume or GitHub regenerates your Career Twin before
              recomputing everything.
            </p>
          )}

          {updateError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {updateError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button onClick={applyUpdates} disabled={updating} className="flex-1">
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              {updating ? updateStep ?? "Applying…" : "Apply & recompute"}
            </Button>
            <Button variant="outline" onClick={() => setShowUpdate(false)} disabled={updating}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <ChatWidget />
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-8 sm:px-5 sm:py-10">
      <Skeleton className="h-64 rounded-3xl" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <PageScene />
      <ConfigBanner />
      <Navbar />
      <DashboardInner />
    </AuthGuard>
  );
}
