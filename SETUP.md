# AI Job Assistant — Setup Guide

This project now has real, working integrations instead of stubs/placeholders.
See `DEPLOY.md` for going live on the internet — this file covers running it
locally.

## What's real now

- **Job listings** — pulled live from the Adzuna Jobs API if `ADZUNA_APP_ID`/
  `ADZUNA_APP_KEY` are set; falls back to 2 seed jobs otherwise.
- **Gmail monitoring** — real OAuth2 flow. Once connected in Settings, it
  reads recent job-related emails and classifies them as Interview / Offer /
  Rejection / Applied / Update, and re-checks every 6 hours automatically.
- **AI resume optimization** — real PDF/DOCX text extraction, sent to OpenAI
  for an ATS score + specific suggestions.
- **AI cover letters** — generated per application from your resume + the
  job's actual description.
- **Auto-fill assistant** — opens a job's apply page with headless Chromium
  and fills in what it recognizes from your profile, then hands you back a
  screenshot. It deliberately does **not** click submit — see the comment in
  `backend/Services/autoApply.js`.

## 1. Install PostgreSQL and create the database

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE ai_job_assistant;"
```

Then load the schema:

```bash
psql -h localhost -U postgres -d ai_job_assistant -f backend/database/schema.sql
```

## 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Fill in what you have — everything works with just `DATABASE_URL` and
`JWT_SECRET` set; the AI/Gmail/real-listings features activate automatically
once their respective keys are added. See the comments in `.env.example` for
where to get each key.

Note: a `@` in your DB password must be URL-encoded as `%40` in
`DATABASE_URL`, or the connection string won't parse.

## 3. Install backend dependencies

```bash
cd backend
npm install
npx playwright install --with-deps chromium   # needed for the auto-fill feature
```

## 4. Start the backend

```bash
node server.js
```

You should see:
```
✅ PostgreSQL Database Connected
🚀 AI Job Assistant Backend
Server running on http://localhost:5000
```

## 5. Open the app

The backend now serves the frontend directly (from `../frontend`), so there's
no separate static server to run — just visit:

`http://localhost:5000`

(Previously this required a second `python3 -m http.server` process serving
the HTML files separately; that's no longer necessary since the frontend
folder is served by the same Express app. All API calls in the frontend now
use relative paths like `/api/jobs` instead of a hardcoded
`http://localhost:5000`, so this also works unchanged once deployed to a
real domain.)

## Known limitations / next steps

- The Playwright auto-fill assistant works well on simple ATS-hosted forms
  (Greenhouse, Lever, etc.); heavily JS-driven application forms or ones
  behind CAPTCHAs may not fill reliably — it degrades gracefully to "nothing
  filled, here's a screenshot."
- The `trackApplications` toggle in Settings is still local-only (no
  matching DB column).
- Microsoft/Outlook email monitoring isn't implemented (only Gmail).
