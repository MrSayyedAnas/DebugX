/**
 * @file project.routes.js
 * @description Routes for project management.
 *
 * BASE: /api/v1/projects
 */

"use strict";

const express = require("express");
const router = express.Router();

const projectController = require("../controllers/project.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} = require("../validations/project.validation");

// All project routes require authentication
router.use(protect);

router
  .route("/")
  .get(projectController.getProjects)
  .post(
    authorize("admin", "developer"),
    validate(createProjectSchema),
    projectController.createProject
  );

router
  .route("/:id")
  .get(projectController.getProjectById)
  .patch(validate(updateProjectSchema), projectController.updateProject)
  .delete(projectController.deleteProject);

router.post(
  "/:id/members",
  authorize("admin", "developer"),
  validate(addMemberSchema),
  projectController.addMember
);

module.exports = router;
