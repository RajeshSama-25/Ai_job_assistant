// ==========================================
// Application Routes
// Routes/applicationRoutes.js
// ==========================================

import express from "express";
import auth from "../middleware/auth.js";
import {
    getApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    generateCoverLetterForApplication,
    autoFillApplication
} from "../Controllers/applicationsController.js";

const router = express.Router();

router.get("/", auth, getApplications);
router.post("/", auth, createApplication);
router.patch("/:id", auth, updateApplication);
router.delete("/:id", auth, deleteApplication);
router.post("/:id/cover-letter", auth, generateCoverLetterForApplication);
router.post("/:id/auto-fill", auth, autoFillApplication);

export default router;
