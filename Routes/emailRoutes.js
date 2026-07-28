// ==========================================
// Email Routes
// Routes/emailRoutes.js
// ==========================================

import express from "express";
import auth from "../middleware/auth.js";
import {
    getEmails,
    getGmailStatus,
    connectGmail,
    gmailCallback,
    syncGmail
} from "../Controllers/emailController.js";

const router = express.Router();

router.get("/", auth, getEmails);
router.get("/gmail/status", auth, getGmailStatus);
router.get("/gmail/connect", auth, connectGmail);
router.get("/gmail/callback", gmailCallback); // Google redirects here directly, no bearer token available
router.post("/gmail/sync", auth, syncGmail);

export default router;
