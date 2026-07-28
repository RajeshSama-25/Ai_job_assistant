// ==========================================
// AI Matching Service
// Services/aiService.js
// ==========================================
//
// Scores how well a job matches a resume. Uses OpenAI by default (works
// anywhere, including a deployed server with no GPU). If OPENAI_API_KEY isn't
// set, falls back to a local Ollama model for people running this on their
// own machine - see SETUP.md.

import OpenAI from "openai";
import ollama from "ollama";

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function buildPrompt(job, resumeSkills) {
    return `You are an AI recruitment assistant.

Resume Skills:
${resumeSkills.join("\n")}

Job Title:
${job.title}

Company:
${job.company}

Job Description:
${job.description}

Return ONLY a number between 0 and 100 representing the match percentage. No words, just the number.`;
}

export async function matchJob(job, resumeSkills = ["JavaScript", "Node.js", "Express", "React", "PostgreSQL"]) {
    const prompt = buildPrompt(job, resumeSkills);

    if (openai) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 10,
            });

            return response.choices[0]?.message?.content?.trim() || "0";
        } catch (error) {
            console.error("OpenAI match error:", error.message);
            return "0";
        }
    }

    // Fallback: local Ollama model (requires `ollama pull llama3.1:8b` on the host)
    try {
        const response = await ollama.chat({
            model: "llama3.1:8b",
            messages: [{ role: "user", content: prompt }],
        });

        return response.message.content;
    } catch (error) {
        console.error("Ollama Error:", error.message);
        return "0";
    }
}
