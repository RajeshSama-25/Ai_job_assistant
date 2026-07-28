// ==========================================
// Job Search Service
// Services/jobSearch.js
// ==========================================
//
// Pulls real, current listings from the Adzuna Jobs API (https://developer.adzuna.com/)
// when ADZUNA_APP_ID / ADZUNA_APP_KEY are configured in .env. Adzuna has a
// free developer tier and, unlike scraping LinkedIn/Naukri, is an approved
// public API — no ToS risk.
//
// If no Adzuna keys are set, falls back to a small set of seed jobs so the
// app still has data to show in a fresh local install.

import { matchJob } from "./aiService.js";
import { query } from "../config/db.js";

const seedJobs = [
    {
        title: "Node.js Developer (Entry Level)",
        company: "ABC Technologies",
        location: "Remote",
        work_mode: "Remote",
        salary: "\u20b9 4-6 LPA",
        description: "Looking for a fresher Node.js developer with Express.js, React.js and REST API exposure.",
        apply_url: null,
        source: "seed"
    },
    {
        title: "Junior Full Stack Developer",
        company: "TechSoft",
        location: "Hyderabad, India",
        work_mode: "Remote",
        salary: "\u20b9 3.5-5 LPA",
        description: "React.js, Node.js, Express.js, MongoDB, Git and REST API experience required. Freshers welcome.",
        apply_url: null,
        source: "seed"
    }
];

async function fetchFromAdzuna() {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) return null;

    // "in" = India. what=entry level software roles, sorted by newest.
    const url = new URL("https://api.adzuna.com/v1/api/jobs/in/search/1");
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", "20");
    url.searchParams.set("what", "software developer entry level fresher");
    url.searchParams.set("sort_by", "date");
    url.searchParams.set("content-type", "application/json");

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Adzuna API returned ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map((r) => ({
        title: r.title?.replace(/<[^>]*>/g, "") || "Untitled role",
        company: r.company?.display_name || "Unknown company",
        location: r.location?.display_name || "India",
        work_mode: /remote/i.test(r.title + " " + r.description) ? "Remote" : "On-site/Hybrid",
        salary: r.salary_min
            ? `\u20b9${Math.round(r.salary_min).toLocaleString("en-IN")} - \u20b9${Math.round(r.salary_max || r.salary_min).toLocaleString("en-IN")}`
            : "Not disclosed",
        description: (r.description || "").replace(/<[^>]*>/g, "").slice(0, 2000),
        apply_url: r.redirect_url,
        source: "adzuna"
    }));
}

export async function searchJobs() {
    console.log("Searching Jobs...\n");

    let jobs;
    try {
        jobs = await fetchFromAdzuna();
    } catch (error) {
        console.error("Adzuna fetch failed, falling back to seed jobs:", error.message);
        jobs = null;
    }

    if (!jobs) {
        const existing = await query("SELECT COUNT(*)::int AS count FROM jobs");
        if (existing.rows[0].count > 0) {
            console.log("Jobs table already seeded, skipping.");
            return;
        }
        jobs = seedJobs;
    }

    for (const job of jobs) {
        // Dedupe by apply_url when we have one (real listings), otherwise by title+company.
        const existing = job.apply_url
            ? await query("SELECT id FROM jobs WHERE apply_url = $1", [job.apply_url])
            : await query(
                  "SELECT id FROM jobs WHERE job_title = $1 AND company = $2",
                  [job.title, job.company]
              );

        if (existing.rows.length > 0) continue;

        const matchResult = await matchJob(job).catch(() => "0");

        await query(
            `INSERT INTO jobs (company, job_title, location, work_mode, salary, description, apply_url, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [job.company, job.title, job.location, job.work_mode, job.salary, job.description, job.apply_url, job.source]
        );

        console.log(`Added: ${job.title} @ ${job.company} (match score: ${matchResult})`);
    }
}
