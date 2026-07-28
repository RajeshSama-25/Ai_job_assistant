// ==========================================
// Resume Routes
// Routes/resumeRoutes.js
// ==========================================

import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
    uploadResume,
    getLatestResume,
    optimizeResume
} from "../Controllers/resumeController.js";

const router = express.Router();

router.get("/", auth, getLatestResume);
router.post("/upload", auth, upload.single("resume"), uploadResume);
router.post("/optimize", auth, optimizeResume);

export default router;
