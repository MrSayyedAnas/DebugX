/**
 * @file ci.controller.js
 * @description HTTP handlers for CI/CD webhook endpoints.
 */

"use strict";

const ciService = require("../services/ci.service");
const { sendSuccess } = require("../utils/ApiResponse");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * POST /api/v1/ci/webhook
 * Receive and process GitHub Actions webhook.
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const result = await ciService.processWebhook(req.body);
  sendSuccess(res, 200, "Webhook processed successfully", { result });
});

/**
 * GET /api/v1/ci/history/:bugId
 * Get CI/CD history for a specific bug.
 */
const getCIHistory = asyncHandler(async (req, res) => {
  const history = await ciService.getCIHistory(req.params.bugId);
  sendSuccess(res, 200, "CI/CD history fetched successfully", { history });
});

/**
 * GET /api/v1/ci/health
 * CI/CD integration health check.
 */
const health = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "CI/CD integration is active", {
    status: "active",
    webhookEndpoint: "/api/v1/ci/webhook",
    supportedEvents: ["success", "failure", "pending"],
  });
});

module.exports = { handleWebhook, getCIHistory, health };
