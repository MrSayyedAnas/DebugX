/**
 * @file project.controller.js
 * @description HTTP handlers for project endpoints.
 */

"use strict";

const projectService = require("../services/project.service");
const { sendSuccess } = require("../utils/ApiResponse");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user.id);
  sendSuccess(res, 201, "Project created successfully", { project });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user.id, req.user.role);
  sendSuccess(res, 200, "Projects fetched successfully", { projects, count: projects.length });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.params.id, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Project fetched successfully", { project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.id, req.body, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Project updated successfully", { project });
});

const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const project = await projectService.addMember(
    req.params.id, userId, role, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Member added successfully", { project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user.id, req.user.role);
  sendSuccess(res, 200, "Project deleted successfully", {});
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addMember,
  deleteProject,
};
