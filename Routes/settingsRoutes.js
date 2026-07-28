// ==========================================
// Settings Routes
// Routes/settingsRoutes.js
// ==========================================

import express from "express";
import auth from "../middleware/auth.js";
import {
    getSettings,
    saveSettings
} from "../Controllers/settingsController.js";

const router = express.Router();

router.get("/", auth, getSettings);
router.post("/", auth, saveSettings);

export default router;
