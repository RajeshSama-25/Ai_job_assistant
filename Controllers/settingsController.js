// ==========================================
// Settings Controller
// Controllers/settingsController.js
// ==========================================

import { query } from "../config/db.js";

// GET /api/settings
export const getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const userResult = await query(
            "SELECT id, full_name, email FROM users WHERE id = $1",
            [userId]
        );

        const profileResult = await query(
            "SELECT * FROM profiles WHERE user_id = $1",
            [userId]
        );

        const aiResult = await query(
            "SELECT * FROM ai_settings WHERE user_id = $1",
            [userId]
        );

        res.json({
            success: true,
            user: userResult.rows[0] || null,
            profile: profileResult.rows[0] || null,
            ai_settings: aiResult.rows[0] || null
        });

    } catch (error) {
        console.error("Get Settings Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch settings"
        });
    }
};

// POST /api/settings
export const saveSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            full_name,
            phone,
            country,
            city,
            linkedin,
            github,
            portfolio,
            bio,
            auto_resume,
            auto_cover_letter,
            auto_job_match,
            follow_up
        } = req.body;

        // Update basic user info
        if (full_name) {
            await query(
                "UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
                [full_name, userId]
            );
        }

        // Upsert profile
        const existingProfile = await query(
            "SELECT id FROM profiles WHERE user_id = $1",
            [userId]
        );

        let profile;

        if (existingProfile.rows.length > 0) {
            const result = await query(
                `UPDATE profiles SET
                    phone = COALESCE($1, phone),
                    country = COALESCE($2, country),
                    city = COALESCE($3, city),
                    linkedin = COALESCE($4, linkedin),
                    github = COALESCE($5, github),
                    portfolio = COALESCE($6, portfolio),
                    bio = COALESCE($7, bio)
                 WHERE user_id = $8
                 RETURNING *`,
                [phone, country, city, linkedin, github, portfolio, bio, userId]
            );
            profile = result.rows[0];
        } else {
            const result = await query(
                `INSERT INTO profiles
                    (user_id, phone, country, city, linkedin, github, portfolio, bio)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 RETURNING *`,
                [userId, phone, country, city, linkedin, github, portfolio, bio]
            );
            profile = result.rows[0];
        }

        // Upsert AI settings
        const existingAi = await query(
            "SELECT id FROM ai_settings WHERE user_id = $1",
            [userId]
        );

        let aiSettings;

        if (existingAi.rows.length > 0) {
            const result = await query(
                `UPDATE ai_settings SET
                    auto_resume = COALESCE($1, auto_resume),
                    auto_cover_letter = COALESCE($2, auto_cover_letter),
                    auto_job_match = COALESCE($3, auto_job_match),
                    follow_up = COALESCE($4, follow_up)
                 WHERE user_id = $5
                 RETURNING *`,
                [auto_resume, auto_cover_letter, auto_job_match, follow_up, userId]
            );
            aiSettings = result.rows[0];
        } else {
            const result = await query(
                `INSERT INTO ai_settings
                    (user_id, auto_resume, auto_cover_letter, auto_job_match, follow_up)
                 VALUES ($1,$2,$3,$4,$5)
                 RETURNING *`,
                [
                    userId,
                    auto_resume ?? true,
                    auto_cover_letter ?? true,
                    auto_job_match ?? true,
                    follow_up ?? false
                ]
            );
            aiSettings = result.rows[0];
        }

        res.json({
            success: true,
            message: "Settings saved successfully",
            profile,
            ai_settings: aiSettings
        });

    } catch (error) {
        console.error("Save Settings Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to save settings"
        });
    }
};
