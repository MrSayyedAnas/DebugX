/**
 * @file webhook.middleware.js
 * @description GitHub webhook signature verification middleware.
 *
 * WHY VERIFY SIGNATURES:
 *   Anyone could send fake requests to /api/v1/ci/webhook
 *   and manipulate bug statuses.
 *
 *   GitHub signs every webhook with HMAC-SHA256 using a secret.
 *   We verify this signature to ensure requests are genuine.
 *
 * HOW IT WORKS:
 *   1. GitHub sends: X-Hub-Signature-256: sha256=<hash>
 *   2. We compute HMAC of the raw body using our secret
 *   3. Compare — if they match → request is genuine ✅
 */

"use strict";

const crypto = require("crypto");
const logger = require("../utils/logger");

/**
 * Verify GitHub webhook signature.
 * Skips verification in development if no secret is configured.
 */
const verifyWebhookSignature = (req, res, next) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // Skip verification in development if secret not configured
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("Webhook signature verification skipped (no secret configured)");
      return next();
    }
    return res.status(500).json({
      success: false,
      message: "Webhook secret not configured",
    });
  }

  const signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    return res.status(401).json({
      success: false,
      message: "Missing webhook signature",
    });
  }

  // Compute expected signature
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  // Compare signatures securely (prevents timing attacks)
  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (
    sigBuffer.length !== digestBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, digestBuffer)
  ) {
    logger.warn(`Invalid webhook signature from ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  next();
};

module.exports = { verifyWebhookSignature };
