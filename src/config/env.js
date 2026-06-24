/**
 * @file env.js
 * @description Centralized, validated environment configuration.
 *
 * WHY: Accessing process.env directly throughout the app leads to
 * silent failures and scattered magic strings. This module:
 *   1. Loads .env via dotenv
 *   2. Validates required variables at startup
 *   3. Exports a single frozen config object
 *
 * If a required variable is missing, the process exits immediately
 * with a clear error — fail fast, fail loud.
 */

"use strict";

const dotenv = require("dotenv");

// Load .env file into process.env
dotenv.config();

/**
 * List of environment variables that MUST be present.
 * Add to this list as the project grows.
 */
const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET"];

/**
 * Validate that all required env vars are set.
 * Crashes the process at startup if any are missing.
 */
const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[ENV ERROR] Missing required environment variables: ${missing.join(", ")}`
    );
    console.error(
      `[ENV ERROR] Please check your .env file against .env.example`
    );
    process.exit(1); // Crash early — do not start the server
  }
};

validateEnv();

/**
 * Exported configuration object.
 * Use this everywhere instead of process.env directly.
 *
 * Object.freeze ensures no module accidentally mutates config.
 */
const config = Object.freeze({
  // ── Server ─────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: (process.env.NODE_ENV || "development") === "development",
  isProd: process.env.NODE_ENV === "production",

  // ── Database ────────────────────────────────────
  mongoUri: process.env.MONGO_URI,

  // ── Authentication ──────────────────────────────
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // ── AI Microservice ─────────────────────────────
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
});

module.exports = config;
