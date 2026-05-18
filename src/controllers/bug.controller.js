/**
 * @file bug.controller.js
 * @description HTTP handlers for bug endpoints.
 */

"use strict";

const bugService = require("../services/bug.service");
const { sendSuccess } = require("../utils/ApiResponse");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const createBug = asyncHandler(async (req, res) => {
  const bug = await bugService.createBug(req.body, req.user.id, req.user.role);
  sendSuccess(res, 201, "Bug reported successfully", { bug });
});

const getBugsByProject = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    priority: req.query.priority,
    category: req.query.category,
    assignedTo: req.query.assignedTo,
  };
  const bugs = await bugService.getBugsByProject(
    req.params.projectId, filters, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Bugs fetched successfully", { bugs, count: bugs.length });
});

const getBugById = asyncHandler(async (req, res) => {
  const bug = await bugService.getBugById(req.params.id, req.user.id, req.user.role);
  sendSuccess(res, 200, "Bug fetched successfully", { bug });
});

const updateBug = asyncHandler(async (req, res) => {
  const bug = await bugService.updateBug(
    req.params.id, req.body, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Bug updated successfully", { bug });
});

const assignBug = asyncHandler(async (req, res) => {
  const bug = await bugService.assignBug(
    req.params.id, req.body.assigneeId, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Bug assigned successfully", { bug });
});

const updateBugStatus = asyncHandler(async (req, res) => {
  const bug = await bugService.updateBugStatus(
    req.params.id, req.body.status, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Bug status updated successfully", { bug });
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await bugService.addComment(
    req.params.id, req.body.content, req.user.id, req.user.role
  );
  sendSuccess(res, 201, "Comment added successfully", { comment });
});

const getComments = asyncHandler(async (req, res) => {
  const comments = await bugService.getComments(
    req.params.id, req.user.id, req.user.role
  );
  sendSuccess(res, 200, "Comments fetched successfully", { comments, count: comments.length });
});

const deleteBug = asyncHandler(async (req, res) => {
  await bugService.deleteBug(req.params.id, req.user.id, req.user.role);
  sendSuccess(res, 200, "Bug deleted successfully", {});
});

module.exports = {
  createBug,
  getBugsByProject,
  getBugById,
  updateBug,
  assignBug,
  updateBugStatus,
  addComment,
  getComments,
  deleteBug,
};
