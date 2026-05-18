/**
 * @file analytics.routes.js
 * @description Routes for developer analytics.
 *
 * BASE: /api/v1/analytics
 */

"use strict";

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);

// Individual developer analytics
router.get("/developer/:userId", analyticsController.getDeveloperAnalytics);

// Full project analytics
router.get("/project/:projectId", analyticsController.getProjectAnalytics);

// Bug trends over time
router.get("/trends/:projectId", analyticsController.getBugTrends);

// Team performance (admin + developer)
router.get(
  "/team/:projectId",
  authorize("admin", "developer"),
  analyticsController.getTeamPerformance
);

module.exports = router;
