/**
 * @file logger.js
 * @description Application-wide logger built on Winston.
 *
 * WHY WINSTON OVER console.log:
 *   - Log levels (error, warn, info, debug) allow filtering in prod
 *   - Timestamps on every message
 *   - In production: outputs structured JSON (parseable by log aggregators)
 *   - In development: colorized, human-readable output
 *   - Can be extended to write to files, Datadog, Sentry, etc.
 *
 * USAGE:
 *   const logger = require('./utils/logger');
 *   logger.info('Server started');
 *   logger.error('Something broke', { meta: 'data' });
 */

"use strict";

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, colorize, printf, json, errors } = format;

// ── Custom Format for Development ────────────────────────────────────────────
// Produces: [2024-01-15 10:30:00] INFO: Server started on port 5000
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }), // Print full stack traces
  printf(({ level, message, timestamp, stack }) => {
    // If there's a stack trace (i.e., an Error was logged), show it
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

// ── Format for Production ─────────────────────────────────────────────────────
// Produces structured JSON — easy to ingest with log aggregation tools
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json() // {"level":"info","message":"...","timestamp":"..."}
);

// ── Logger Instance ──────────────────────────────────────────────────────────
const logger = createLogger({
  // Minimum level to log. In prod, skip debug messages.
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Choose format based on environment
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,

  transports: [
    // Always log to console
    new transports.Console(),

    // In production, also write errors to a file
    ...(process.env.NODE_ENV === "production"
      ? [
          new transports.File({ filename: "logs/error.log", level: "error" }),
          new transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],

  // Don't crash the process if logger itself fails
  exitOnError: false,
});

module.exports = logger;
