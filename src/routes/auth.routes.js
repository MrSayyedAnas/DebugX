/**
 * @file auth.routes.js
 * @description Route definitions for authentication endpoints.
 *
 * ROUTES:
 *   POST   /api/v1/auth/register  → Register new user
 *   POST   /api/v1/auth/login     → Login, receive JWT
 *   GET    /api/v1/auth/me        → Get own profile (protected)
 *
 * MIDDLEWARE CHAIN per route:
 *   Public:    validate → controller
 *   Protected: protect  → controller
 */

"use strict";

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.validation");

// ── Auth-Specific Rate Limiter ────────────────────────────────────────────────

/**
 * Stricter rate limit for auth endpoints.
 * Prevents brute-force login and mass registration attacks.
 * 10 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many auth attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @middleware authLimiter → validate(registerSchema) → controller
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password, returns JWT token
 * @access  Public
 * @middleware authLimiter → validate(loginSchema) → controller
 */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (JWT required)
 * @middleware protect → controller
 */
router.get("/me", protect, authController.getMe);

module.exports = router;
