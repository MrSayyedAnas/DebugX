/**
 * @file stats.routes.js
 * @description Routes for statistics and search.
 *
 * BASE: /api/v1/stats
 */

"use strict";

const express = require("express");
const router = express.Router();

const statsController = require("../controllers/stats.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

router.use(protect);

// Project statistics
router.get("/projects/:projectId", statsController.getProjectStats);

// System-wide statistics (admin only)
router.get("/system", authorize("admin"), statsController.getSystemStats);

// Advanced bug search with pagination
router.get("/bugs/search/:projectId", statsController.searchBugs);

module.exports = router;
