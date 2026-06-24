/**
 * @file server.js
 * @description Application entry point.
 *
 * Responsibilities:
 *   1. Connect to MongoDB
 *   2. Start the HTTP server
 *   3. Handle graceful shutdown (SIGTERM / SIGINT)
 *
 * WHY GRACEFUL SHUTDOWN:
 *   When deploying (e.g., Docker, Kubernetes, PM2), the process receives
 *   SIGTERM before being killed. Graceful shutdown lets in-flight requests
 *   finish and closes the DB connection cleanly — preventing data corruption.
 */

"use strict";

const app = require("./src/app");
const connectDB = require("./src/config/db");
const config = require("./src/config/env");
const logger = require("./src/utils/logger");

// ── Unhandled Rejection / Exception Guards ────────────────────────────────────

/**
 * Catches async errors that were not handled with try/catch.
 * Example: a promise that rejects but nobody awaits it.
 *
 * In production, these should be logged and the process restarted
 * by a process manager (PM2, Docker restart policy, etc.)
 */
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // Give the server time to finish in-flight requests, then exit
  gracefulShutdown("unhandledRejection");
});

/**
 * Catches synchronous errors that were thrown but never caught.
 * These are almost always programming bugs — log and exit.
 */
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  gracefulShutdown("uncaughtException");
});

// ── Server Bootstrap ─────────────────────────────────────────────────────────

let server; // Keep a reference for graceful shutdown

/**
 * Bootstrap sequence:
 *   1. Connect to MongoDB (exits on failure)
 *   2. Start HTTP server
 */
const bootstrap = async () => {
  logger.info("Starting DebugX API... v1.0.1");

  // Step 1: Connect to MongoDB
  await connectDB();

  // Step 2: Start HTTP server
  server = app.listen(config.port, () => {
   logger.info(`✅ DebugX Server running in [${config.nodeEnv}] mode on port ${config.port}`);
logger.info(`🔗 Health check: http://localhost:${config.port}/api/health`);
  });

  // Increase default keep-alive timeout slightly above load balancer timeout
  server.keepAliveTimeout = 65 * 1000;
  server.headersTimeout = 66 * 1000;
};

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

/**
 * Attempt a clean shutdown:
 *   1. Stop accepting new connections
 *   2. Wait for active connections to close
 *   3. Exit the process
 *
 * @param {string} signal - The signal or event that triggered shutdown
 */
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info("HTTP server closed. All connections drained.");
      process.exit(0);
    });

    // Force-exit after 10 seconds if connections don't drain
    setTimeout(() => {
      logger.error("Could not close connections in time. Forcing exit.");
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
};

// Handle Docker / Kubernetes stop signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C in terminal

// ── Start ─────────────────────────────────────────────────────────────────────
bootstrap();
