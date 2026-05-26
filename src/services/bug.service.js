/**
 * @file bug.service.js
 * @description Business logic for bug management.
 */

"use strict";

const Bug = require("../models/bug.model");
const Comment = require("../models/comment.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const { buildQuery, paginate } = require("../utils/queryBuilder");
const { classifyBug } = require("../utils/aiClassifier");

// ── Valid Status Transitions ──────────────────────────────────────────────────
const STATUS_TRANSITIONS = {
  open: ["in_progress", "closed"],
  in_progress: ["resolved", "open", "closed"],
  resolved: ["closed", "open"],
  closed: ["open", "in_progress"],   // ✅ allow reopening via existing statuses
  reopened: ["in_progress", "closed"],
};

const createBug = async (data, userId, userRole) => {
  const { projectId, title, description, priority, severity,
    category, stepsToReproduce, environment, tags } = data;

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  if (userRole !== "admin" && !project.isMember(userId)) {
    throw ApiError.forbidden("You are not a member of this project");
  }

  const bug = await Bug.create({
    title, description,
    priority: priority || "medium",
    severity: severity || "moderate",
    category: category || "other",
    stepsToReproduce, environment,
    tags: tags || [],
    project: projectId,
    reportedBy: userId,
  });

  bug.logActivity("bug_created", userId, `Bug "${title}" was created`);
  await bug.save();

  await bug.populate([
    { path: "reportedBy", select: "name email" },
    { path: "project", select: "name" },
  ]);

  logger.info(`Bug created: "${title}" in project ${projectId}`);

  // Trigger AI classification asynchronously (non-blocking)
  setImmediate(() => classifyBug(bug._id, title, description));

  return bug;
};

const getBugsByProject = async (projectId, filters, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  if (userRole !== "admin" && !project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this project");
  }

  const query = { project: projectId };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.category) query.category = filters.category;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;

  const bugs = await Bug.find(query)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email")
    .select("-activityLog")
    .sort({ createdAt: -1 });

  return bugs;
};

const getBugById = async (bugId, userId, userRole) => {
  const bug = await Bug.findById(bugId)
    .populate("reportedBy", "name email avatar")
    .populate("assignedTo", "name email avatar")
    .populate("project", "name status")
    .populate("activityLog.performedBy", "name email");

  if (!bug) throw ApiError.notFound("Bug not found");

  const project = await Project.findById(bug.project);
  if (userRole !== "admin" && !project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this bug");
  }

  return bug;
};

const updateBug = async (bugId, data, userId, userRole) => {
  const bug = await Bug.findById(bugId).populate("project");
  if (!bug) throw ApiError.notFound("Bug not found");

  if (userRole !== "admin" && !bug.project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this bug");
  }

  const allowedFields = [
    "title", "description", "priority", "severity",
    "category", "stepsToReproduce", "environment", "tags",
  ];

  const changes = [];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== bug[field]) {
      changes.push(`${field}: "${bug[field]}" → "${data[field]}"`);
      bug[field] = data[field];
    }
  });

  if (changes.length > 0) {
    bug.logActivity("bug_updated", userId, `Updated: ${changes.join(", ")}`);
  }

  await bug.save();
  return bug;
};

const assignBug = async (bugId, assigneeId, userId, userRole) => {
  const bug = await Bug.findById(bugId).populate("project");
  if (!bug) throw ApiError.notFound("Bug not found");

  if (userRole !== "admin" && !bug.project.isMember(userId)) {
    throw ApiError.forbidden("You cannot assign this bug");
  }

  const previousAssignee = bug.assignedTo;
  bug.assignedTo = assigneeId;

  if (bug.status === "open") bug.status = "in_progress";

  bug.logActivity("bug_assigned", userId, `Bug assigned to user ${assigneeId}`,
    { from: previousAssignee, to: assigneeId }
  );

  await bug.save();
  await bug.populate("assignedTo", "name email");

  logger.info(`Bug ${bugId} assigned to ${assigneeId}`);
  return bug;
};

const updateBugStatus = async (bugId, newStatus, userId, userRole) => {
  const bug = await Bug.findById(bugId).populate("project");
  if (!bug) throw ApiError.notFound("Bug not found");

  if (userRole !== "admin" && !bug.project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this bug");
  }

  const allowedTransitions = STATUS_TRANSITIONS[bug.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid status transition: "${bug.status}" → "${newStatus}". ` +
      `Allowed transitions: ${allowedTransitions.join(", ")}`
    );
  }

  const previousStatus = bug.status;
  bug.status = newStatus;

  bug.logActivity("status_changed", userId,
    `Status changed from "${previousStatus}" to "${newStatus}"`,
    { from: previousStatus, to: newStatus }
  );

  await bug.save();
  logger.info(`Bug ${bugId} status: ${previousStatus} → ${newStatus}`);
  return bug;
};

const addComment = async (bugId, content, userId, userRole) => {
  const bug = await Bug.findById(bugId).populate("project");
  if (!bug) throw ApiError.notFound("Bug not found");

  if (userRole !== "admin" && !bug.project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this bug");
  }

  const comment = await Comment.create({ content, bug: bugId, author: userId });

  bug.logActivity("comment_added", userId, `Comment added`);
  await bug.save();

  await comment.populate("author", "name email avatar");
  return comment;
};

const getComments = async (bugId, userId, userRole) => {
  const bug = await Bug.findById(bugId).populate("project");
  if (!bug) throw ApiError.notFound("Bug not found");

  if (userRole !== "admin" && !bug.project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this bug");
  }

  return Comment.find({ bug: bugId })
    .populate("author", "name email avatar")
    .sort({ createdAt: 1 });
};

const deleteBug = async (bugId, userId, userRole) => {
  const bug = await Bug.findById(bugId);
  if (!bug) throw ApiError.notFound("Bug not found");

  if (userRole !== "admin" && bug.reportedBy.toString() !== userId.toString()) {
    throw ApiError.forbidden("Only the reporter or admin can delete this bug");
  }

  await Comment.deleteMany({ bug: bugId });
  await bug.deleteOne();
  logger.info(`Bug ${bugId} deleted by user ${userId}`);
};

// ── Phase 4: Advanced Search & Filter ────────────────────────────────────────

const searchBugs = async (projectId, queryParams, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  if (userRole !== "admin" && !project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this project");
  }

  const { filter, sort, pagination } = buildQuery(queryParams, [
    "status", "priority", "severity", "category", "assignedTo", "aiClassified",
  ]);

  filter.project = projectId;

  const result = await paginate(
    Bug, filter, sort, pagination,
    [
      { path: "reportedBy", select: "name email" },
      { path: "assignedTo", select: "name email" },
    ],
    "-activityLog"
  );

  return result;
};

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
  searchBugs,
};
