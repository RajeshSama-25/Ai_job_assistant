// ==========================================
// Resume Controller
// Controllers/resumeController.js
// ==========================================

import { query } from "../config/db.js";
import { parseResume } from "../Services/resumeParser.js";
import { getResumeSuggestions } from "../Services/openaiService.js";

// POST /api/resume/upload
export const uploadResume = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const extractedText = await parseResume(req.file.path, req.file.mimetype);

        // Best-effort AI pass at upload time; never block the upload if it fails
        // (e.g. no OPENAI_API_KEY configured yet).
        let atsScore = 0;
        let aiSummary = null;

        try {
            const suggestions = await getResumeSuggestions(extractedText);
            atsScore = suggestions.ats_score || 0;
            aiSummary = suggestions.summary || null;
        } catch (aiError) {
            console.warn("Resume AI scoring skipped:", aiError.message);
        }

        const result = await query(
            `INSERT INTO resumes (user_id, file_name, file_path, ats_score, ai_summary, extracted_text)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, user_id, file_name, file_path, ats_score, ai_summary, uploaded_at`,
            [userId, req.file.originalname, req.file.path, atsScore, aiSummary, extractedText]
        );

        res.status(201).json({
            success: true,
            message: "Resume uploaded successfully",
            resume: result.rows[0]
        });

    } catch (error) {
        console.error("Resume Upload Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to upload resume"
        });
    }
};

// GET /api/resume
export const getLatestResume = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT id, user_id, file_name, file_path, ats_score, ai_summary, uploaded_at
             FROM resumes
             WHERE user_id = $1
             ORDER BY uploaded_at DESC
             LIMIT 1`,
            [userId]
        );

        res.json({
            success: true,
            resume: result.rows[0] || null
        });

    } catch (error) {
        console.error("Get Resume Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch resume"
        });
    }
};

// POST /api/resume/optimize  — re-run AI suggestions on the latest resume,
// optionally targeting a specific role
export const optimizeResume = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetRole } = req.body;

        const latest = await query(
            `SELECT * FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
            [userId]
        );

        if (latest.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Upload a resume first" });
        }

        const resume = latest.rows[0];
        const suggestions = await getResumeSuggestions(resume.extracted_text || "", targetRole);

        await query(
            "UPDATE resumes SET ats_score = $1, ai_summary = $2 WHERE id = $3",
            [suggestions.ats_score || resume.ats_score, suggestions.summary, resume.id]
        );

        res.json({ success: true, ...suggestions });

    } catch (error) {
        console.error("Resume Optimize Error:", error.message);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to optimize resume"
        });
    }
};
