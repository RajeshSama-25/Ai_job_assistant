// ==========================================
// Jobs Controller
// Controllers/jobsController.js
// ==========================================

import { query } from "../config/db.js";

// GET /api/jobs
export const getJobs = async (req, res) => {
    try {
        const result = await query(
            "SELECT * FROM jobs ORDER BY created_at DESC"
        );

        res.json({
            success: true,
            jobs: result.rows
        });

    } catch (error) {
        console.error("Get Jobs Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs"
        });
    }
};

// GET /api/jobs/:id
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            "SELECT * FROM jobs WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.json({
            success: true,
            job: result.rows[0]
        });

    } catch (error) {
        console.error("Get Job Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job"
        });
    }
};

// POST /api/jobs  (used internally by the job search service, and available for manual entry)
export const createJob = async (req, res) => {
    try {
        const {
            company,
            job_title,
            location,
            work_mode,
            salary,
            description,
            apply_url,
            source
        } = req.body;

        if (!company || !job_title) {
            return res.status(400).json({
                success: false,
                message: "company and job_title are required"
            });
        }

        const result = await query(
            `INSERT INTO jobs
                (company, job_title, location, work_mode, salary, description, apply_url, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [company, job_title, location, work_mode, salary, description, apply_url, source]
        );

        res.status(201).json({
            success: true,
            job: result.rows[0]
        });

    } catch (error) {
        console.error("Create Job Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create job"
        });
    }
};
