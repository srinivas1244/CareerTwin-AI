"use client";

import { useState } from "react";
import {
  Sparkles,
  FolderGit2,
  Award,
  GitBranch,
  Star,
  GitFork,
  Code2,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Section } from "./Section";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scoreTone, TONE_TEXT } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { CareerProfile, GithubProfile } from "@/lib/types";

// ── Drawer panels ─────────────────────────────────────────────────────────────

function DrawerPanel({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="surface rounded-2xl p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-brand" />
        {title}
        {typeof count === "number" && (
          <span className="text-xs font-normal text-muted">({count})</span>
        )}
      </p>
      {children}
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <Badge key={`${s}-${i}`}>{s}</Badge>
      ))}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-2 text-center">
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-muted" />
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function DrawerContent({
  profile,
  github,
}: {
  profile: CareerProfile;
  github: GithubProfile | null;
}) {
  const topLanguages = Object.entries(github?.languages ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topRepos = (github?.top_repos ?? [])
    .slice()
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  return (
    <div className="space-y-3">
      {/* GitHub */}
      <DrawerPanel icon={GitBranch} title="GitHub">
        {github ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium">@{github.username}</span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  TONE_TEXT[scoreTone(github.github_strength_score)]
                )}
              >
                {github.github_strength_score}
                <span className="text-xs font-normal text-muted">/100</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat icon={FolderGit2} label="Repos" value={github.repo_count} />
              <Stat icon={Star} label="Stars" value={github.total_stars} />
              <Stat icon={GitFork} label="Forks" value={github.total_forks} />
            </div>
            {topLanguages.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                  Languages
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {topLanguages.map(([lang]) => (
                    <Badge key={lang}>
                      <Code2 className="mr-1 h-3 w-3 text-muted" />
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {topRepos.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                  Top repositories
                </p>
                <ul className="space-y-1.5">
                  {topRepos.map((r) => (
                    <li
                      key={r.name}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5"
                    >
                      <span className="truncate text-sm text-foreground/90">{r.name}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                        {r.language && <span>{r.language}</span>}
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3" /> {r.stars}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">
            GitHub not connected. Add your username via{" "}
            <span className="text-foreground/90">Improve my profile</span>.
          </p>
        )}
      </DrawerPanel>

      {/* Skills */}
      <DrawerPanel icon={Sparkles} title="Skills" count={profile.skills.length}>
        <Chips items={profile.skills} empty="No skills extracted." />
        {profile.technologies.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Tech Stack ({profile.technologies.length})
            </p>
            <Chips items={profile.technologies} empty="None detected." />
          </div>
        )}
      </DrawerPanel>

      {/* Projects */}
      <DrawerPanel icon={FolderGit2} title="Projects" count={profile.projects.length}>
        {profile.projects.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {profile.projects.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className="rounded-xl border border-white/5 bg-white/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {p.source && (
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                      {p.source}
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>
                )}
                {p.technologies && p.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.technologies.slice(0, 4).map((t, j) => (
                      <span
                        key={j}
                        className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No projects detected.</p>
        )}
      </DrawerPanel>

      {/* Certifications */}
      <DrawerPanel
        icon={Award}
        title="Certifications"
        count={profile.certifications.length}
      >
        {profile.certifications.length ? (
          <ul className="space-y-2">
            {profile.certifications.map((c, i) => (
              <li
                key={`${c.name}-${i}`}
                className="rounded-lg border border-white/5 bg-white/5 px-3 py-2"
              >
                <p className="text-sm text-foreground/90">{c.name}</p>
                {c.issuer && <p className="text-xs text-muted">{c.issuer}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No certifications listed.</p>
        )}
      </DrawerPanel>
    </div>
  );
}

// ── Compact summary stat pill ─────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function TwinOverview({
  profile,
  github,
}: {
  profile: CareerProfile;
  github: GithubProfile | null;
}) {
  const [open, setOpen] = useState(false);

  const summary =
    profile.summary?.slice(0, 160) +
    (profile.summary && profile.summary.length > 160 ? "…" : "");

  return (
    <>
      <Section
        eyebrow="Extracted profile"
        title="Career Twin"
        subtitle="What we extracted from your resume and GitHub."
      >
        <div className="surface surface-hover rounded-2xl p-5 sm:p-6">
          {/* Summary text */}
          {summary && (
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-foreground/80">
              {summary}
            </p>
          )}

          {/* Stat row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <StatPill icon={Sparkles} label="Skills" value={profile.skills.length} />
            <StatPill icon={FolderGit2} label="Projects" value={profile.projects.length} />
            <StatPill icon={Layers} label="Tech Stack" value={profile.technologies.length} />
            <StatPill icon={Award} label="Certifications" value={profile.certifications.length} />

            {github && (
              <>
                <span className="hidden text-white/15 sm:inline">·</span>
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted" />
                  <span className="text-sm text-muted">@{github.username}</span>
                  <span
                    className={cn(
                      "ml-1 text-sm font-semibold tabular-nums",
                      TONE_TEXT[scoreTone(github.github_strength_score)]
                    )}
                  >
                    {github.github_strength_score}
                    <span className="text-xs font-normal text-muted">/100</span>
                  </span>
                </div>
              </>
            )}

            {/* CTA pushed to the right on wide screens */}
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-1.5"
              >
                View Full Twin
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Career Twin"
        description="Full profile extracted from your resume and GitHub."
      >
        <DrawerContent profile={profile} github={github} />
      </Drawer>
    </>
  );
}
