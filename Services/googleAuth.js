// ==========================================
// Google OAuth2 Helper (Gmail access)
// Services/googleAuth.js
// ==========================================

import { google } from "googleapis";
import dotenv from "dotenv";
import { query } from "../config/db.js";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export function getOAuthClient() {
    const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.BACKEND_URL || "http://localhost:5000"}/api/email/gmail/callback`;

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
}

// Build the URL the user visits to grant Gmail read access.
// `state` carries the logged-in user's id through the redirect so we know
// whose account to attach the tokens to when Google calls us back.
export function getAuthUrl(userId) {
    const client = getOAuthClient();

    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        state: String(userId),
    });
}

export async function saveTokensForUser(userId, tokens) {
    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    const existing = await query(
        "SELECT id, refresh_token FROM oauth_accounts WHERE user_id = $1 AND provider = 'google'",
        [userId]
    );

    // Google only sends a refresh_token on the FIRST consent; keep the old one
    // on later token refreshes instead of overwriting it with null.
    const refreshToken = tokens.refresh_token || existing.rows[0]?.refresh_token || null;

    if (existing.rows.length > 0) {
        await query(
            `UPDATE oauth_accounts
             SET access_token = $1, refresh_token = $2, token_expiry = $3
             WHERE user_id = $4 AND provider = 'google'`,
            [tokens.access_token, refreshToken, expiry, userId]
        );
    } else {
        await query(
            `INSERT INTO oauth_accounts (user_id, provider, access_token, refresh_token, token_expiry)
             VALUES ($1, 'google', $2, $3, $4)`,
            [userId, tokens.access_token, refreshToken, expiry]
        );
    }
}

export async function getGmailClientForUser(userId) {
    const result = await query(
        "SELECT access_token, refresh_token, token_expiry FROM oauth_accounts WHERE user_id = $1 AND provider = 'google'",
        [userId]
    );

    const account = result.rows[0];
    if (!account) return null;

    const client = getOAuthClient();
    client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.token_expiry ? new Date(account.token_expiry).getTime() : null,
    });

    // Refresh + persist automatically if the access token is expired.
    client.on("tokens", async (tokens) => {
        await saveTokensForUser(userId, { ...tokens, refresh_token: tokens.refresh_token || account.refresh_token });
    });

    return google.gmail({ version: "v1", auth: client });
}
