// Mirrors backend/app/schemas/career.py

export interface CertificationItem {
  name: string;
  issuer?: string | null;
}

export interface ProjectItem {
  name: string;
  description?: string | null;
  technologies?: string[];
  source?: string | null;
}

export interface ExperienceItem {
  title?: string | null;
  company?: string | null;
  duration?: string | null;
  description?: string | null;
}

export interface EducationItem {
  degree?: string | null;
  institution?: string | null;
  year?: string | null;
}

export interface RoleOption {
  key: string;
  label: string;
}

export interface ContactInfo {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface LinksInfo {
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  other?: string[];
}

export interface CareerProfile {
  contact: ContactInfo;
  links: LinksInfo;
  skills: string[];
  technologies: string[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  achievements: string[];
  inferred_role?: string | null;
  target_role?: string | null;
  target_role_label?: string | null;
  career_goal?: string | null;
  summary?: string | null;
  role_options: RoleOption[];
}

export interface RepoInsight {
  name: string;
  description?: string | null;
  language?: string | null;
  stars: number;
  forks: number;
  has_readme: boolean;
  topics: string[];
  pushed_at?: string | null;
}

export interface GithubProfile {
  username: string;
  repo_count: number;
  total_stars: number;
  total_forks: number;
  languages: Record<string, number>;
  github_strength_score: number;
  top_repos: RepoInsight[];
  insights: string[];
}

export interface CategoryScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  weighted: number;
  details: string[];
}

export interface ScoreExplanation {
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface HiringScore {
  hiring_score: number;
  role?: string | null;
  role_label?: string | null;
  breakdown: CategoryScore[];
  explanation?: ScoreExplanation | null;
}

export interface ResumeUploadResult {
  resume_id: string;
  file_name: string;
  has_text: boolean;
  char_count: number;
}

export type EvidenceLevel = "Strong" | "Medium" | "Weak" | "Missing";

export interface SkillEvidenceItem {
  skill: string;
  level: EvidenceLevel;
  evidence_score: number;
  signals: string[];
}

export interface RealityCheck {
  credibility_score: number;
  counts: Record<string, number>;
  evidence: SkillEvidenceItem[];
  explanation?: ScoreExplanation | null;
}

export interface ProjectRecommendation {
  name: string;
  description: string;
  why_it_matters: string;
  difficulty: string;
  timeline: string;
  architecture: string;
  tech_stack: string[];
  key_skills: string[];
}

export interface ProjectGap {
  target_role?: string | null;
  target_role_label?: string | null;
  missing_count: number;
  projects: ProjectRecommendation[];
}

export interface Scenario {
  action_type: string;
  label: string;
  target: string;
  projected_score: number;
  delta: number;
}

export interface RoadmapStep {
  action_type: string;
  label: string;
  target: string;
  projected_score: number;
  delta: number;
}

export interface Simulation {
  base_score: number;
  scenarios: Scenario[];
  roadmap: RoadmapStep[];
  roadmap_final_score: number;
  explanation?: ScoreExplanation | null;
}

export interface RoadmapPhase {
  name: string;
  focus: string;
  duration: string;
  skills: string[];
  why: string;
  project: string;
}

export interface CareerRoadmap {
  target_role?: string | null;
  target_role_label?: string | null;
  career_goal?: string | null;
  missing_skills: string[];
  summary: string;
  phases: RoadmapPhase[];
}

export interface Conversation {
  id: string;
  title: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string | null;
}
