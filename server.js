import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import "./Services/scheduler.js";
import { searchJobs } from "./Services/jobSearch.js";
import connectdb from "./config/db.js";

// Routes
import authRoutes from "./Routes/authRoutes.js";
import jobRoutes from "./Routes/jobRoutes.js";
import applicationRoutes from "./Routes/applicationRoutes.js";
import resumeRoutes from "./Routes/resumeRoutes.js";
import emailRoutes from "./Routes/emailRoutes.js";
import settingsRoutes from "./Routes/settingsRoutes.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, "..", "frontend");

const app = express();
const PORT = process.env.PORT || 5000;

// ======================================
// Middleware
// ======================================

// contentSecurityPolicy off: the frontend pages use inline <script>/<style>
// tags, which helmet's default CSP blocks. Fine for this single-origin app;
// tighten this if the frontend is ever split onto its own domain.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/uploads", express.static("uploads"));

// Serve the frontend (login/dashboard/jobs/etc.) from the same server so the
// whole app is one deployable unit — no separate static host needed.
app.use(express.static(frontendDir));

// ======================================
// Health Check
// ======================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "AI Job Assistant API Running 🚀",
        version: "1.0.0",
    });
});

// ======================================
// Routes
// ======================================

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/settings", settingsRoutes);

// ======================================
// 404 Handler
// ======================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Route Not Found",
    });
});

// ======================================
// Error Handler
// ======================================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// ======================================
// Start Server
// ======================================

async function startServer() {
    try {
        await connectdb();

        app.listen(PORT, async () => {
            console.log("=================================");
            console.log("🚀 AI Job Assistant Backend");
            console.log("=================================");
            console.log(`Server running on http://localhost:${PORT}`);
            console.log("Database Connected");
            console.log("=================================");

            // Run AI Job Search once on startup
            await searchJobs();
        });
    } catch (error) {
        console.error("Server Startup Failed");
        console.error(error);
        process.exit(1);
    }
}

startServer();