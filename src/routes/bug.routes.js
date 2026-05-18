/**
 * @file bug.routes.js
 * @description Routes for bug management.
 *
 * BASE: /api/v1/bugs
 */

"use strict";

const express = require("express");
const router = express.Router();

const bugController = require("../controllers/bug.controller");
const { protect } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  createBugSchema,
  updateBugSchema,
  updateStatusSchema,
  assignBugSchema,
  addCommentSchema,
} = require("../validations/bug.validation");

// All bug routes require authentication
router.use(protect);

// ── Bug CRUD ──────────────────────────────────────────────────────────────────
router
  .route("/")
  .post(validate(createBugSchema), bugController.createBug);

router
  .route("/:id")
  .get(bugController.getBugById)
  .patch(validate(updateBugSchema), bugController.updateBug)
  .delete(bugController.deleteBug);

// ── Bug Actions ───────────────────────────────────────────────────────────────
router.patch("/:id/status", validate(updateStatusSchema), bugController.updateBugStatus);
router.patch("/:id/assign", validate(assignBugSchema), bugController.assignBug);

// ── Comments ──────────────────────────────────────────────────────────────────
router
  .route("/:id/comments")
  .get(bugController.getComments)
  .post(validate(addCommentSchema), bugController.addComment);

// ── Bugs by Project ───────────────────────────────────────────────────────────
router.get("/project/:projectId", bugController.getBugsByProject);

module.exports = router;
