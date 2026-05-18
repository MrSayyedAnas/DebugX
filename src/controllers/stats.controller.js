/**
 * @file stats.controller.js
 * @description HTTP handlers for statistics endpoints.
 */

"use strict";

const statsService = require("../services/stats.service");
const bugService = require("../services/bug.service");
const { sendSuccess, sendPaginated } = require("../utils/ApiResponse");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /api/v1/stats/projects/:projectId
 * Get stats for a specific project.
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getProjectStats(
    req.params.projectId,
    req.user.id,
    req.user.role
  );
  sendSuccess(res, 200, "Project stats fetched successfully", { stats });
});

/**
 * GET /api/v1/stats/system
 * Get overall system stats (admin only).
 */
const getSystemStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getSystemStats();
  sendSuccess(res, 200, "System stats fetched successfully", { stats });
});

/**
 * GET /api/v1/stats/bugs/search/:projectId
 * Search and filter bugs with pagination.
 */
const searchBugs = asyncHandler(async (req, res) => {
  const result = await bugService.searchBugs(
    req.params.projectId,
    req.query,
    req.user.id,
    req.user.role
  );

  sendPaginated(
    res,
    result.data,
    result.meta,
    "Bugs fetched successfully"
  );
});

module.exports = { getProjectStats, getSystemStats, searchBugs };
