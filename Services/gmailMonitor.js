// ==========================================
// Gmail Monitoring Service
// Services/gmailMonitor.js
// ==========================================

import { query } from "../config/db.js";
import { getGmailClientForUser } from "./googleAuth.js";

// Very small, transparent keyword classifier. No AI call needed for this -
// it's cheap, fast, and easy for the user to see exactly why an email got
// tagged the way it did.
function classifyEmail(subject, snippet) {
    const text = `${subject} ${snippet}`.toLowerCase();

    if (/(interview|schedule a call|meet with|technical round)/.test(text)) {
        return "Interview";
    }
    if (/(offer|congratulations|pleased to offer|welcome to the team)/.test(text)) {
        return "Offer";
    }
    if (/(unfortunately|not moving forward|other candidates|regret to inform|not selected)/.test(text)) {
        return "Rejection";
    }
    if (/(application received|thank you for applying|we have received your application)/.test(text)) {
        return "Applied";
    }
    return "Update";
}

function getHeader(headers, name) {
    return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

// Pulls recent messages that look job-related and stores any new ones.
// Safe to call repeatedly - gmail_message_id is UNIQUE, so re-checking the
// same inbox never creates duplicate rows.
export async function checkEmailsForUser(userId) {
    const gmail = await getGmailClientForUser(userId);
    if (!gmail) {
        return { connected: false, newEmails: 0 };
    }

    const searchQuery =
        'newer_than:14d (subject:(application OR interview OR offer OR position OR role OR "thank you for applying"))';

    const list = await gmail.users.messages.list({
        userId: "me",
        q: searchQuery,
        maxResults: 20,
    });

    const messages = list.data.messages || [];
    let newCount = 0;

    for (const msg of messages) {
        const exists = await query(
            "SELECT id FROM emails WHERE gmail_message_id = $1",
            [msg.id]
        );
        if (exists.rows.length > 0) continue;

        const full = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From"],
        });

        const headers = full.data.payload?.headers || [];
        const subject = getHeader(headers, "Subject");
        const sender = getHeader(headers, "From");
        const snippet = full.data.snippet || "";
        const status = classifyEmail(subject, snippet);

        await query(
            `INSERT INTO emails (user_id, gmail_message_id, sender, subject, body, email_status, received_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [userId, msg.id, sender, subject, snippet, status]
        );

        newCount++;
    }

    return { connected: true, newEmails: newCount };
}

// Called on a schedule for every user who has connected Gmail.
export async function checkEmailsForAllConnectedUsers() {
    const accounts = await query(
        "SELECT user_id FROM oauth_accounts WHERE provider = 'google'"
    );

    for (const row of accounts.rows) {
        try {
            await checkEmailsForUser(row.user_id);
        } catch (error) {
            console.error(`Gmail check failed for user ${row.user_id}:`, error.message);
        }
    }
}
