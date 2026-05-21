"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config/env");
const logger = require("./utils/logger");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.use(corsMiddleware);
app.options("/{*path}", corsMiddleware);

// ── Security ──────────────────────────────────────────────────────────────────

app.use(helmet());

// ── Rate Limiting ─────────────────────────────────────────────────────────────

const rateLimitHandler = (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(429).json({
    success: false,
    statusCode: 429,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  });
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,                                              // generous for demo/presentation
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/api/v1/auth"),   // auth has its own limiter
  handler: rateLimitHandler,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

app.use(globalLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────

app.use(express.json({
  limit: "10kb",
  verify: (req, res, buf) => { req.rawBody = buf.toString(); },
}));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── HTTP Logging ──────────────────────────────────────────────────────────────

app.use(morgan(config.isDev ? "dev" : "combined", {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => req.url === "/api/health",
}));

// ── Health Check ──────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bug Tracker API is running",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/v1/auth",      authLimiter, require("./routes/auth.routes"));
app.use("/api/v1/projects",               require("./routes/project.routes"));
app.use("/api/v1/bugs",                   require("./routes/bug.routes"));
app.use("/api/v1/stats",                  require("./routes/stats.routes"));
app.use("/api/v1/ci",                     require("./routes/ci.routes"));
app.use("/api/v1/analytics",              require("./routes/analytics.routes"));

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (config.isDev) {
    logger.error(err.stack);
  } else {
    logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || [],
    });
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: config.isDev ? err.message : "Internal Server Error",
  });
});

module.exports = app;