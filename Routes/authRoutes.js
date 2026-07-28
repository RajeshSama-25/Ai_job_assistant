// ==========================================
// Authentication Routes
// routes/authRoutes.js
// ==========================================

import express from "express";

import {
    register,
    login,
    getMe
} from "../Controllers/authcontroller.js";

import auth from "../middleware/auth.js";


const router = express.Router();


// ==========================================
// Public Routes
// ==========================================

// Register
router.post(
    "/register",
    register
);


// Login
router.post(
    "/login",
    login
);


// ==========================================
// Protected Routes
// ==========================================

// Current User
router.get(
    "/me",
    auth,
    getMe
);


export default router;