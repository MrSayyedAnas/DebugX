/**
 * @file ci.service.js
 * @description Business logic for CI/CD webhook integration.
 *
 * Handles GitHub Actions webhook events and updates
 * bug status automatically based on build results.
 */

"use strict";

const Bug = require("../models/bug.model");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Process a CI/CD webhook event from GitHub Actions.
 *
 * FLOW:
 *   1. Validate webhook payload
 *   2. Find bug by ID
 *   3. Update status based on build result
 *   4. Save commit/PR info
 *   5. Log activity
 *
 * @param {Object} payload - Webhook payload from GitHub Actions
 */
const processWebhook = async (payload) => {
  const {
    bugId,
    status,      // "success" | "failure" | "pending"
    commit,      // Git commit SHA
    branch,      // Branch name
    pullRequest, // PR URL (optional)
    buildUrl,    // GitHub Actions build URL
    triggeredBy, // GitHub username
  } = payload;

  // Validate required fields
  if (!bugId || !status || !commit) {
    throw ApiError.badRequest(
      "Missing required fields: bugId, status, commit"
    );
  }

  // Find the bug
  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw ApiError.notFound(`Bug not found: ${bugId}`);
  }

  // ── Update Bug Based on Build Status ───────────────────────────────────────
  let newStatus = bug.status;
  let activityMessage = "";

  switch (status) {
    case "success":
      // Build passed → mark bug as resolved
      if (["open", "in_progress", "reopened"].includes(bug.status)) {
        newStatus = "resolved";
        activityMessage = `Automatically resolved via CI/CD. Commit: ${commit} by ${triggeredBy || "GitHub Actions"}`;
      }
      break;

    case "failure":
      // Build failed → move back to in_progress
      if (bug.status === "resolved") {
        newStatus = "reopened";
        activityMessage = `Reopened due to CI/CD failure. Commit: ${commit}`;
      } else {
        newStatus = "in_progress";
        activityMessage = `Build failed. Commit: ${commit} by ${triggeredBy || "GitHub Actions"}`;
      }
      break;

    case "pending":
      // Build started → mark as in_progress
      if (bug.status === "open") {
        newStatus = "in_progress";
        activityMessage = `Build started. Commit: ${commit} by ${triggeredBy || "GitHub Actions"}`;
      }
      break;

    default:
      throw ApiError.badRequest(
        `Invalid status: "${status}". Must be: success, failure, pending`
      );
  }

  // ── Save Changes ────────────────────────────────────────────────────────────
  const previousStatus = bug.status;
  bug.status = newStatus;
  bug.linkedCommit = commit;

  if (pullRequest) {
    bug.linkedPR = pullRequest;
  }

  // Log the CI/CD activity
  bug.logActivity(
    "ci_cd_update",
    null, // No user — triggered by GitHub Actions
    activityMessage,
    { from: previousStatus, to: newStatus }
  );

  await bug.save();

  logger.info(
    `CI/CD webhook processed: Bug ${bugId} → ${previousStatus} → ${newStatus} ` +
    `(commit: ${commit}, status: ${status})`
  );

  return {
    bugId,
    previousStatus,
    newStatus,
    commit,
    branch,
    buildStatus: status,
    message: activityMessage,
  };
};

/**
 * Get CI/CD history for a bug.
 * Returns all activity log entries related to CI/CD.
 *
 * @param {string} bugId
 */
const getCIHistory = async (bugId) => {
  const bug = await Bug.findById(bugId)
    .select("title activityLog linkedCommit linkedPR");

  if (!bug) throw ApiError.notFound("Bug not found");

  // Filter only CI/CD related activities
  const ciActivities = bug.activityLog.filter(
    (log) => log.action === "ci_cd_update"
  );

  return {
    bugId,
    title: bug.title,
    linkedCommit: bug.linkedCommit,
    linkedPR: bug.linkedPR,
    ciHistory: ciActivities,
  };
};

module.exports = { processWebhook, getCIHistory };
