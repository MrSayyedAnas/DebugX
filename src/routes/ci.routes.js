/**
 * @file ci.routes.js
 * @description Routes for CI/CD webhook integration.
 *
 * BASE: /api/v1/ci
 */

"use strict";

const express = require("express");
const router = express.Router();

const ciController = require("../controllers/ci.controller");
const { protect } = require("../middlewares/auth.middleware");
const { verifyWebhookSignature } = require("../middlewares/webhook.middleware");

// Health check — public
router.get("/health", ciController.health);

// Webhook endpoint — verified by GitHub signature
// No JWT auth (GitHub can't send JWT)
// Instead uses webhook signature verification
router.post("/webhook", verifyWebhookSignature, ciController.handleWebhook);

// CI history — requires JWT auth
router.get("/history/:bugId", protect, ciController.getCIHistory);

module.exports = router;
