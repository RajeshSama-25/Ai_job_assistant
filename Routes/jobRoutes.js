// ==========================================
// Job Routes
// Routes/jobRoutes.js
// ==========================================

import express from "express";
import auth from "../middleware/auth.js";
import {
    getJobs,
    getJobById,
    createJob
} from "../Controllers/jobsController.js";

const router = express.Router();

router.get("/", auth, getJobs);
router.get("/:id", auth, getJobById);
router.post("/", auth, createJob);

export default router;
