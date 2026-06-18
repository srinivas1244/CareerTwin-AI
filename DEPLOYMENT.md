# 🚀 Deployment Guide

CareerTwin AI runs as two services on free tiers, both pointed at one Supabase
project:

- **Backend (FastAPI)** → **Render** (Blueprint: [`render.yaml`](render.yaml))
- **Frontend (Next.js)** → **Vercel** (root directory `frontend`)

> **Deploy in order.** The frontend build needs the backend URL, and the backend
> needs the frontend URL for CORS. Backend first → frontend → then set the
> backend's `FRONTEND_ORIGIN`.

---

## 0. Supabase (once)

1. **SQL Editor** → run the migrations in order:
   `db/migrations/0001_init.sql` → `0002_phase2.sql` → `0003_roadmap_progress.sql`.
2. **Storage** → create a public bucket named **`resumes`**.
3. **Project Settings → API** → copy the **URL**, **anon key**, and
   **service-role key**.

---

## 1. Backend → Render

The repo ships a [`render.yaml`](render.yaml) Blueprint.

1. Render dashboard → **New → Blueprint** → connect this repo. Render reads
   `render.yaml` and creates the `careertwin-api` web service:
   - **build:** `pip install -r requirements.txt`
   - **start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **health check:** `/health`
   - **root directory:** `backend`
2. Fill in the secret env vars (those marked `sync: false`):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
   `GROQ_API_KEY`, and optionally `GITHUB_TOKEN`. **Leave `FRONTEND_ORIGIN`
   blank for now** — you'll set it in step 3.
3. Deploy, then note the service URL, e.g. `https://careertwin-api.onrender.com`,
   and confirm `GET /health` returns `{"status":"ok", ...}`.

**Notes**

- Prefer manual setup? Create a **Web Service**, set **Root Directory** to
  `backend`, and reuse the same build/start commands + env vars.
- The Render **free** plan sleeps after ~15 min idle, so the first request after
  a nap is slow (cold start).
- `PYTHON_VERSION` is pinned to `3.13.4` in `render.yaml` — change it there if
  Render reports that version is unavailable.

---

## 2. Frontend → Vercel

1. Vercel → **New Project** → import this repo.
2. **Root Directory** → set to `frontend` (it's a monorepo). Next.js is
   auto-detected (a minimal [`frontend/vercel.json`](frontend/vercel.json) pins
   the framework).
3. Add environment variables for **Production** and **Preview**:

   | key | value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `NEXT_PUBLIC_API_BASE_URL` | the Render backend URL from step 1 |

   `NEXT_PUBLIC_*` vars are inlined at **build time** — set them before the first
   build (redeploy if you add them later).
4. Deploy, then note the frontend URL, e.g. `https://careertwin.vercel.app`.

---

## 3. Wire CORS back to the frontend

In Render, set the backend's `FRONTEND_ORIGIN` to your Vercel URL and redeploy:

```text
FRONTEND_ORIGIN=https://careertwin.vercel.app
```

To also allow Vercel **preview** deployments (their URLs change per commit):

```text
FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
```

(Comma-separate multiple exact origins in `FRONTEND_ORIGIN` if needed.)

---

## 4. Supabase Auth redirect URLs

Supabase → **Authentication → URL Configuration** → add your Vercel domain to
**Site URL** and **Redirect URLs** so email-confirmation links resolve correctly.

---

## ✅ Post-deploy smoke test

Open the Vercel URL → **sign up** → **upload a resume** → **enter a GitHub
username** → **generate the Career Twin** → confirm the **Hiring Score** and
dashboard render.

Troubleshooting:

| symptom | fix |
|---|---|
| API calls fail with a CORS error | re-check `FRONTEND_ORIGIN` on Render matches the exact Vercel origin |
| 401 / auth errors | confirm `NEXT_PUBLIC_SUPABASE_*` and backend `SUPABASE_*` point to the same project |
| first request hangs ~30s | Render free-tier cold start; retry once it wakes |
| resume upload fails | ensure the public `resumes` Storage bucket exists |

---

## Environment variable reference

**`backend/.env`** (Render env)

| key | purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side DB + Storage access |
| `SUPABASE_ANON_KEY` | verifies user JWTs |
| `SUPABASE_STORAGE_BUCKET` | resume bucket name (default `resumes`) |
| `GROQ_API_KEY` | Groq AI access (server only) |
| `GROQ_PRIMARY_MODEL` / `GROQ_FALLBACK_MODEL` | model ids |
| `GITHUB_TOKEN` | optional — raises public GitHub rate limits |
| `FRONTEND_ORIGIN` | CORS allow-list, comma-separated |
| `FRONTEND_ORIGIN_REGEX` | optional CORS regex (e.g. Vercel previews) |
| `MAX_RESUME_MB` | upload size cap (default `5`) |

**`frontend/.env.local`** (Vercel env)

| key | purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser Supabase auth |
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI base URL (the Render service) |

> The Groq and service-role keys are **server-only** and never reach the browser.
> Real `.env` files are git-ignored.
