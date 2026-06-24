/**
 * @file db.js
 * @description MongoDB connection manager using Mongoose.
 *
 * WHY A SEPARATE FILE:
 *   - Keeps app.js clean and single-responsibility
 *   - Allows connection to be mocked in tests
 *   - Centralizes retry logic and connection event handling
 *
 * FEATURES:
 *   - Graceful error messages
 *   - Exits process on initial connection failure (fail fast)
 *   - Mongoose best-practice options pre-configured
 */

"use strict";

const mongoose = require("mongoose");
const config = require("./env");
const logger = require("../utils/logger");

/**
 * Establishes a connection to MongoDB.
 * Exits the process if the initial connection fails.
 *
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(config.mongoUri, {
      // These are the recommended options for Mongoose 7+
      // autoIndex is true in dev (convenience), should be false in prod
      autoIndex: config.isDev,
    });

    logger.info(
      `MongoDB connected: ${connection.connection.host} [DB: ${connection.connection.name}]`
    );
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    // Exit process — there's no point running the API without a database
    process.exit(1);
  }
};

// ── Mongoose Connection Event Listeners ──────────────────────────────────────

/**
 * Fires when Mongoose loses connection after initial success.
 * (e.g., network blip, DB restart)
 */
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

/**
 * Fires when Mongoose successfully reconnects.
 */
mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected successfully.");
});

/**
 * Fires on any Mongoose connection error after initial connect.
 */
mongoose.connection.on("error", (error) => {
  logger.error(`MongoDB runtime error: ${error.message}`);
});

module.exports = connectDB;
