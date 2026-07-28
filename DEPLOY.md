# Going Live — Deployment Guide

This gets the AI Job Assistant running on the public internet. I've prepared
everything that can be prepared in advance (Dockerfile, docker-compose for
local testing, a Render blueprint). The steps below need your own accounts
and clicks — I can't do these from here.

Render is recommended because it needs no server management, has a free
Postgres tier, and reads `render.yaml` to set almost everything up
automatically. Railway or Fly.io work too if you'd rather use those — the
Dockerfile is portable to any of them.

## 1. Push this project to GitHub

```bash
cd ai-job-assistant   # this folder
git init
git add .
git commit -m "AI Job Assistant — real Gmail, AI resume tools, real job listings"
git branch -M main
git remote add origin https://github.com/<your-username>/ai-job-assistant.git
git push -u origin main
```

(`.gitignore` already excludes `.env`, `credentials.json`, and `uploads/` —
double check `git status` before your first commit that none of those show up.)

## 2. Get your API keys ready

You'll paste these into Render's dashboard in step 4 — none of them are
required for the site to come up, but each unlocks one feature:

| Key | Unlocks | Get it from |
|---|---|---|
| `OPENAI_API_KEY` | Resume optimization, cover letters, AI job-match scoring | https://platform.openai.com/api-keys |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | "Connect Gmail" (auto-detect interview/offer/rejection emails) | Google Cloud Console → APIs & Services → Credentials → OAuth client ID (type: Web application). Enable the **Gmail API** in the same project. |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Real, current job listings instead of the 2 seed jobs | https://developer.adzuna.com/ (free signup) |

For the Google OAuth client, add this as an **Authorized redirect URI**
(you'll know your Render URL after step 3 — come back and add it then):
`https://<your-render-app>.onrender.com/api/email/gmail/callback`

## 3. Deploy on Render

1. Go to https://dashboard.render.com → **New** → **Blueprint**
2. Connect the GitHub repo you pushed in step 1
3. Render reads `render.yaml` and shows you: one web service + one free
   Postgres database. Click **Apply**.
4. It will ask for the `sync: false` values from the table above
   (`OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, etc.) — paste them in. You can skip
   any you don't have yet and add them later from the service's
   **Environment** tab (it redeploys automatically when you save).
5. Once it's live, copy the service URL and:
   - Add `<url>/api/email/gmail/callback` to your Google OAuth client's
     redirect URIs (step 2)
   - Set `GOOGLE_REDIRECT_URI` env var on Render to that same full URL

## 4. Load the database schema

Render's free Postgres gives you a connection string on its dashboard page.
Run the schema against it once:

```bash
psql "<the External Database URL Render shows you>" -f backend/database/schema.sql
```

## 5. Verify it's working

Visit `https://<your-render-app>.onrender.com` — you should land on the
login page. Register an account, log in, and check:
- Jobs page shows real listings (if Adzuna keys were set) or the 2 seed jobs
- Settings → Connect Gmail redirects to Google's consent screen
- Resume → upload a PDF/DOCX → Optimize returns real AI suggestions (if
  `OPENAI_API_KEY` was set)

## Notes on the auto-fill (auto-apply) feature

It runs headless Chromium via Playwright, which the Dockerfile installs.
Render's free/starter plan should handle occasional use fine; if you scale
this up heavily, a dedicated worker with more memory would be more reliable
than running it inline on the web service.

It intentionally **fills forms but never clicks submit** — see the comment
at the top of `backend/Services/autoApply.js` for why. That's a deliberate
choice, not a missing feature: you review and submit the applications
yourself, and blind automated submission risks violating individual job
sites' terms of service.

## Local testing before you deploy (optional but recommended)

```bash
cp backend/.env.example .env   # fill in what you have
docker compose up --build
```

Visit `http://localhost:5000`. This runs the same Docker image Render will
run, against a local Postgres, so it's a good way to catch problems before
they're live.
