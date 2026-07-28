// ==========================================
// Applications Controller
// Controllers/applicationsController.js
// ==========================================

import { query } from "../config/db.js";
import { generateCoverLetter } from "../Services/openaiService.js";
import { prepareApplication } from "../Services/autoApply.js";

// GET /api/applications
export const getApplications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT
                a.id,
                a.status,
                a.applied_date,
                a.interview_date,
                a.notes,
                j.id AS job_id,
                j.company,
                j.job_title,
                j.location,
                j.work_mode,
                j.salary
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             WHERE a.user_id = $1
             ORDER BY a.applied_date DESC`,
            [userId]
        );

        res.json({
            success: true,
            applications: result.rows
        });

    } catch (error) {
        console.error("Get Applications Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch applications"
        });
    }
};

// POST /api/applications
export const createApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id, status, notes } = req.body;

        if (!job_id) {
            return res.status(400).json({
                success: false,
                message: "job_id is required"
            });
        }

        const jobCheck = await query(
            "SELECT id FROM jobs WHERE id = $1",
            [job_id]
        );

        if (jobCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const result = await query(
            `INSERT INTO applications (user_id, job_id, status, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, job_id, status || "Applied", notes || null]
        );

        res.status(201).json({
            success: true,
            application: result.rows[0]
        });

    } catch (error) {
        console.error("Create Application Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create application"
        });
    }
};

// PATCH /api/applications/:id
export const updateApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status, notes, interview_date } = req.body;

        const result = await query(
            `UPDATE applications
             SET
                status = COALESCE($1, status),
                notes = COALESCE($2, notes),
                interview_date = COALESCE($3, interview_date)
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [status, notes, interview_date, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        res.json({
            success: true,
            application: result.rows[0]
        });

    } catch (error) {
        console.error("Update Application Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update application"
        });
    }
};

// POST /api/applications/:id/cover-letter — drafts a cover letter with AI,
// using the user's latest uploaded resume and this application's job details.
// The letter is saved for review; nothing gets sent or submitted anywhere.
export const generateCoverLetterForApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const appResult = await query(
            `SELECT a.id, j.job_title, j.company, j.description
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             WHERE a.id = $1 AND a.user_id = $2`,
            [id, userId]
        );

        if (appResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const resumeResult = await query(
            `SELECT extracted_text FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
            [userId]
        );

        if (resumeResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Upload a resume first" });
        }

        const userResult = await query("SELECT full_name FROM users WHERE id = $1", [userId]);

        const letter = await generateCoverLetter(
            resumeResult.rows[0].extracted_text || "",
            appResult.rows[0],
            userResult.rows[0]?.full_name
        );

        const updated = await query(
            "UPDATE applications SET cover_letter = $1 WHERE id = $2 RETURNING *",
            [letter, id]
        );

        res.json({ success: true, application: updated.rows[0] });

    } catch (error) {
        console.error("Cover Letter Error:", error.message);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to generate cover letter"
        });
    }
};

// POST /api/applications/:id/auto-fill — opens the job's apply page and
// fills what it can from the user's saved profile + resume. Never submits;
// returns a screenshot so the user can finish and submit it themselves.
export const autoFillApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const appResult = await query(
            `SELECT j.apply_url
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             WHERE a.id = $1 AND a.user_id = $2`,
            [id, userId]
        );

        if (appResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const applyUrl = appResult.rows[0].apply_url;
        if (!applyUrl) {
            return res.status(400).json({ success: false, message: "This job has no apply link on file" });
        }

        const profileResult = await query(
            `SELECT u.full_name, u.email, p.phone, p.linkedin, p.github, p.portfolio
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE u.id = $1`,
            [userId]
        );

        const profileRow = profileResult.rows[0] || {};
        const profile = {
            name: profileRow.full_name,
            email: profileRow.email,
            phone: profileRow.phone,
            linkedin: profileRow.linkedin,
            github: profileRow.github,
            portfolio: profileRow.portfolio,
        };

        const resumeResult = await query(
            `SELECT file_path FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
            [userId]
        );

        const result = await prepareApplication(
            applyUrl,
            profile,
            resumeResult.rows[0]?.file_path || null
        );

        res.json({ success: true, ...result });

    } catch (error) {
        console.error("Auto-Fill Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to auto-fill this application. You may need to fill it in manually."
        });
    }
};

// DELETE /api/applications/:id
export const deleteApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await query(
            "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        res.json({
            success: true,
            message: "Application deleted"
        });

    } catch (error) {
        console.error("Delete Application Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete application"
        });
    }
};
