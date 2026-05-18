/**
 * @file analytics.controller.js
 * @description HTTP handlers for developer analytics endpoints.
 */

"use strict";

const analyticsService = require("../services/analytics.service");
const { sendSuccess } = require("../utils/ApiResponse");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * GET /api/v1/analytics/developer/:userId
 * Get individual developer analytics.
 * Optional query: ?projectId=xxx to scope to a project
 */
const getDeveloperAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getDeveloperAnalytics(
    req.params.userId,
    req.query.projectId || null
  );
  sendSuccess(res, 200, "Developer analytics fetched successfully", { analytics });
});

/**
 * GET /api/v1/analytics/project/:projectId
 * Get full project analytics summary.
 */
const getProjectAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getProjectAnalytics(req.params.projectId);
  sendSuccess(res, 200, "Project analytics fetched successfully", { analytics });
});

/**
 * GET /api/v1/analytics/trends/:projectId
 * Get bug trends over time.
 * Optional query: ?weeks=8
 */
const getBugTrends = asyncHandler(async (req, res) => {
  const weeks = parseInt(req.query.weeks) || 8;
  const trends = await analyticsService.getBugTrends(req.params.projectId, weeks);
  sendSuccess(res, 200, "Bug trends fetched successfully", { trends });
});

/**
 * GET /api/v1/analytics/team/:projectId
 * Get team performance metrics.
 */
const getTeamPerformance = asyncHandler(async (req, res) => {
  const performance = await analyticsService.getTeamPerformance(req.params.projectId);
  sendSuccess(res, 200, "Team performance fetched successfully", { performance });
});

module.exports = {
  getDeveloperAnalytics,
  getProjectAnalytics,
  getBugTrends,
  getTeamPerformance,
};
