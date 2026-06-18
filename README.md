# 🚀 CareerTwin AI

> AI-Powered Career Intelligence Platform

CareerTwin AI creates a personalized **Digital Career Twin** from a user's resume and GitHub profile, providing hiring-readiness scoring, skill validation, project gap analysis, career simulation, personalized roadmaps, and contextual AI career guidance.

---

## 📖 Overview

CareerTwin AI helps users understand:

* How employable they are for a target role
* Whether their resume claims are backed by real evidence
* Which skills and projects they are missing
* What actions will improve their hiring readiness
* A personalized roadmap to reach their career goals

Unlike traditional resume analyzers, CareerTwin combines **deterministic scoring engines**, **GitHub intelligence**, and **LLM-powered career recommendations** to create a living career profile.

**Design principles**

* **Deterministic scoring** — every score is pure Python (no AI, no randomness). The AI only *explains* the computed numbers, it never invents them.
* **Server-only secrets** — the Groq key and Supabase service-role key live only on the backend and never reach the browser.
* **Clean layering** — `routes → services → repositories → schemas + domain`.

---

# ✨ Features

| Feature | What it does |
|---|---|
| 🧠 **Career Twin Generation** | Extracts skills, technologies, projects, and certifications from your resume + GitHub into a persistent profile. |
| 📊 **Hiring Readiness Score** | Deterministic 0–100 score across Skills, Projects, GitHub strength, Certifications, and Resume quality. |
| 🔍 **Resume Reality Check** | Grades each resume claim Strong / Medium / Weak / Missing against real GitHub evidence, with a Credibility Score. |
| 🚀 **Project Gap Detector** | Finds the target role's missing portfolio projects, with difficulty, tech stack, timeline, and impact. |
| 📈 **Career Simulator** | "What if?" engine — re-scores hypothetical actions (learn a skill, ship a project, earn a cert) to project exact gains. |
| 🛣️ **AI Career Roadmap** | Hybrid deterministic + AI plan with phased learning, skill priorities, and recommended projects. |
| 💬 **Career Twin Chat** | A streaming AI advisor grounded in your twin, score, gaps, and roadmap. |
| 🎯 **Personalized Insights** | Surfaces your highest-impact next moves based on score, credibility, and gaps. |

---

# ⚙️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| **Backend** | FastAPI, Python 3.13, Pydantic v2, Uvicorn |
| **Database** | Supabase (PostgreSQL + Auth + Storage), Row Level Security |
| **AI Layer** | Groq (LLM) via a provider abstraction, prompt engineering |
| **Integrations** | GitHub public REST API, resume parsing (PDF/DOCX) |
| **Testing** | Pytest (deterministic scoring) |

---

# Live 
https://career-twin-ai-chi.vercel.app/

# 📂 Project Structure

```text
resume/
├── frontend/              # Next.js 16 app
│   ├── app/               # routes: / · /login · /signup · /onboarding · /dashboard · /chat
│   ├── components/        # UI primitives + dashboard panels
│   └── lib/               # supabase client, API client, types
│
├── backend/               # FastAPI (Python 3.13)
│   └── app/
│       ├── api/           # REST routers
│       ├── core/          # config, supabase client, rate limit, errors
│       ├── domain/        # role profiles + deterministic scoring
│       ├── repositories/  # database access layer
│       ├── schemas/       # Pydantic models
│       └── services/      # resume, github, career-twin, AI
│
├── db/migrations/         # Supabase SQL migrations
├── render.yaml            # Render Blueprint (backend deploy)
├── DEPLOYMENT.md          # full deployment guide
└── README.md
```

---

# 🛠️ Getting Started

**Prerequisites:** Node 20+ · Python 3.13 (3.11+ works) · a Supabase project · a [Groq API key](https://console.groq.com).

### 1. Database

In the Supabase SQL Editor, run the migrations in order:
`db/migrations/0001_init.sql` → `0002_phase2.sql` → `0003_roadmap_progress.sql`.
Then create a public Storage bucket named **`resumes`**.

### 2. Backend

```bash
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate              # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env                # then fill in real values
uvicorn app.main:app --reload       # http://localhost:8000  (docs at /docs)
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local    # then fill in real values
npm install
npm run dev                         # http://localhost:3000
```

---

# 🔐 Environment Variables

**`backend/.env`**

| key | purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side DB + Storage access |
| `SUPABASE_ANON_KEY` | verifies user JWTs |
| `GROQ_API_KEY` | Groq AI access (server only) |
| `GITHUB_TOKEN` | optional — raises public GitHub rate limits |
| `FRONTEND_ORIGIN` | CORS allow-list, comma-separated |
| `FRONTEND_ORIGIN_REGEX` | optional CORS regex (e.g. Vercel previews) |

**`frontend/.env.local`**

| key | purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser Supabase auth |
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI base URL |

> The Groq and service-role keys are **server-only** and never reach the browser. Real `.env` files are git-ignored.

---

# ☁️ Deployment

**Backend → Render** (FastAPI Blueprint in [`render.yaml`](render.yaml)) and
**Frontend → Vercel** (root directory `frontend`), both pointed at one Supabase project.

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step walkthrough. Quick version:

1. **Supabase** — run the 3 migrations, create the public `resumes` bucket.
2. **Render** — New → Blueprint → connect this repo; fill in the Supabase + Groq keys.
3. **Vercel** — import the repo, set Root Directory to `frontend`, add the 3 `NEXT_PUBLIC_*` vars (including the Render URL).
4. **CORS** — set `FRONTEND_ORIGIN` on Render to your Vercel URL and redeploy.

---

# 🧪 Testing

Deterministic scoring is unit-tested (fixed inputs → fixed outputs):

```bash
cd backend
pytest -q
```

---

# 🎯 Use Cases

* Students preparing for placements
* AI/ML Engineers
* Software Developers
* Career Switchers
* Job Seekers
* Professionals targeting specific roles

---

# 🚀 Future Enhancements

* Multi-Role Match
* Recruiter View
* Interview Readiness Analysis
* Benchmark Scoring
* Future Resume Generator

---
