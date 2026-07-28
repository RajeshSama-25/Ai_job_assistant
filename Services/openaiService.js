// ==========================================
// OpenAI Service
// Services/openaiService.js
// ==========================================
//
// Wraps the two generative features the frontend already has buttons for:
// resume optimization suggestions, and per-job cover letter drafts.
// Both are UI-only placeholders until now.

import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function assertConfigured() {
    if (!openai) {
        const err = new Error(
            "OPENAI_API_KEY is not set — add it to backend/.env to enable AI resume/cover-letter features."
        );
        err.status = 503;
        throw err;
    }
}

// Returns a short ATS-style score + 3-5 concrete improvement suggestions.
export async function getResumeSuggestions(resumeText, targetRole = "software developer") {
    assertConfigured();

    const prompt = `You are an ATS (applicant tracking system) and resume reviewer.

Resume text:
"""
${resumeText.slice(0, 6000)}
"""

Target role: ${targetRole}

Respond ONLY with valid JSON in this exact shape, no markdown fences:
{
  "ats_score": <integer 0-100>,
  "summary": "<one sentence overall assessment>",
  "suggestions": ["<specific, actionable suggestion>", "..."]
}
Give 3 to 5 suggestions, each specific to this resume (not generic advice).`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";
    const cleaned = raw.replace(/^```json\s*|```$/g, "");

    try {
        return JSON.parse(cleaned);
    } catch {
        return { ats_score: 0, summary: "Could not parse AI response", suggestions: [] };
    }
}

// Drafts a cover letter tailored to a specific job posting.
export async function generateCoverLetter(resumeText, job, applicantName) {
    assertConfigured();

    const prompt = `Write a concise, genuine-sounding cover letter (250-350 words) for this applicant.

Applicant name: ${applicantName || "the applicant"}
Resume text:
"""
${resumeText.slice(0, 4000)}
"""

Job title: ${job.job_title}
Company: ${job.company}
Job description:
"""
${(job.description || "").slice(0, 2000)}
"""

Write only the letter body (no subject line, no placeholders like [Company Name] — use the real company name given above).`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
    });

    return response.choices[0]?.message?.content?.trim() || "";
}
