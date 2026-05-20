/**
 * @file app.js
 * @description Express application factory.
 *
 * WHY SEPARATE FROM server.js:
 *   app.js builds the Express app with all middleware and routes.
 *   server.js imports app.js and starts the HTTP server.
 *
 *   This means in tests, we can do:
 *     const app = require('./app');
 *     supertest(app).get('/api/health')
 *   ...without actually binding to a port.
 *
 * MIDDLEWARE ORDER MATTERS:
 *   1. Security (helmet, cors, rate limiting)
 *   2. Parsing (json, urlencoded)
 *   3. Logging (morgan)
 *   4. Routes
 *   5. Error handling (MUST be last)
 */

"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config/env");
const logger = require("./utils/logger");

// ── Initialize Express App ───────────────────────────────────────────────────
const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────

/**
 * Helmet sets secure HTTP headers automatically.
 * Protects against common web vulnerabilities:
 * (XSS, clickjacking, MIME sniffing, etc.)
 */
app.use(helmet());

/**
 * CORS configuration.
 * In production, replace '*' with your actual frontend origin.
 */
app.use(
  cors({
    origin: config.isProd ? process.env.CLIENT_URL : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * Global rate limiter — brute-force protection.
 * 100 requests per 15 minutes per IP.
 *
 * Auth routes will get a stricter limiter applied directly.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use(globalLimiter);

// ── Body Parsing ─────────────────────────────────────────────────────────────

// Parse incoming JSON (limit prevents large payload attacks)
app.use(express.json({
  limit: "10kb",
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── HTTP Request Logging ─────────────────────────────────────────────────────

/**
 * Morgan logs each HTTP request.
 * Uses 'dev' format in development (colorized, concise).
 * Uses 'combined' format in production (Apache-style, full details).
 *
 * Feeds into our Winston logger stream so all logs go to one place.
 */
const morganFormat = config.isDev ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: {
      // Pipe morgan output into winston
      write: (message) => logger.http(message.trim()),
    },
    // Skip logging health check endpoints to reduce noise
    skip: (req) => req.url === "/api/health",
  })
);

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * Health check endpoint.
 * Used by load balancers, Docker health checks, and CI/CD pipelines.
 * Always returns 200 if the server is running.
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bug Tracker API is running",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 * New route files are registered here as each phase is built.
 */
// ── Phase 2: Auth ─────────────────────────────────────────────────────────────
app.use("/api/v1/auth", require("./routes/auth.routes"));

// ── Phase 3: Core ────────────────────────────────────────────────────────────
app.use("/api/v1/projects", require("./routes/project.routes"));
app.use("/api/v1/bugs",     require("./routes/bug.routes"));

// ── Phase 4: Stats & Search ─────────────────────────────────────────────────
app.use("/api/v1/stats",    require("./routes/stats.routes"));

// ── Phase 6: CI/CD Integration ──────────────────────────────────────────────
app.use("/api/v1/ci", require("./routes/ci.routes"));

// ── Phase 4.5: Developer Analytics ─────────────────────────────────────────
app.use("/api/v1/analytics", require("./routes/analytics.routes"));

// ── 404 Handler ──────────────────────────────────────────────────────────────

/**
 * Catch-all for any route that doesn't match above.
 * Must be AFTER all valid routes.
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Centralized Error Handler ─────────────────────────────────────────────────

/**
 * Express identifies error-handling middleware by its 4-parameter signature: (err, req, res, next).
 * ALL errors thrown anywhere in the app land here.
 *
 * Handles two types:
 *   1. ApiError (our custom, operational errors) → use their statusCode + message
 *   2. Unknown errors (bugs in our code)          → log fully, return 500
 */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log every error (full stack in dev, message only in prod)
  if (config.isDev) {
    logger.error(err.stack);
  } else {
    logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);
  }

  // If it's our known ApiError, respond with its details
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Unknown error — don't leak internal details to the client
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: config.isDev ? err.message : "Internal Server Error",
  });
});

module.exports = app;
