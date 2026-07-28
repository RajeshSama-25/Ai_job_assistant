// ==========================================
// Email Controller
// Controllers/emailController.js
// ==========================================

import { query } from "../config/db.js";
import { getAuthUrl, getOAuthClient, saveTokensForUser } from "../Services/googleAuth.js";
import { checkEmailsForUser } from "../Services/gmailMonitor.js";

// GET /api/email
export const getEmails = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT * FROM emails
             WHERE user_id = $1
             ORDER BY received_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            emails: result.rows
        });

    } catch (error) {
        console.error("Get Emails Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch emails"
        });
    }
};

// GET /api/email/gmail/status
export const getGmailStatus = async (req, res) => {
    try {
        const result = await query(
            "SELECT created_at FROM oauth_accounts WHERE user_id = $1 AND provider = 'google'",
            [req.user.id]
        );

        res.json({
            success: true,
            connected: result.rows.length > 0,
            connectedAt: result.rows[0]?.created_at || null
        });
    } catch (error) {
        console.error("Gmail Status Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to check Gmail status" });
    }
};

// GET /api/email/gmail/connect  (auth-protected — returns the consent URL)
export const connectGmail = async (req, res) => {
    try {
        const url = getAuthUrl(req.user.id);
        res.json({ success: true, url });
    } catch (error) {
        console.error("Gmail Connect Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to start Gmail connection" });
    }
};

// GET /api/email/gmail/callback  (public — Google redirects here after consent)
export const gmailCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

    try {
        const { code, state } = req.query;
        const userId = parseInt(state, 10);

        if (!code || !userId) {
            return res.redirect(`${frontendUrl}/settings.html?gmail=error`);
        }

        const client = getOAuthClient();
        const { tokens } = await client.getToken(code);

        await saveTokensForUser(userId, tokens);

        // Pull whatever's already sitting in the inbox right away.
        await checkEmailsForUser(userId).catch((e) =>
            console.error("Initial Gmail sync failed:", e.message)
        );

        res.redirect(`${frontendUrl}/settings.html?gmail=connected`);
    } catch (error) {
        console.error("Gmail Callback Error:", error.message);
        res.redirect(`${frontendUrl}/settings.html?gmail=error`);
    }
};

// POST /api/email/gmail/sync  (manual "check now" button)
export const syncGmail = async (req, res) => {
    try {
        const result = await checkEmailsForUser(req.user.id);

        if (!result.connected) {
            return res.status(400).json({
                success: false,
                message: "Gmail is not connected yet"
            });
        }

        res.json({ success: true, newEmails: result.newEmails });
    } catch (error) {
        console.error("Gmail Sync Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to sync Gmail" });
    }
};
