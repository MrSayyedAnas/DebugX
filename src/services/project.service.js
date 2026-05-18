/**
 * @file project.service.js
 * @description Business logic for project management.
 */

"use strict";

const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Create a new project.
 * The creator is automatically added as an admin member.
 *
 * @param {Object} data - { name, description, repositoryUrl }
 * @param {string} userId - ID of the user creating the project
 */
const createProject = async (data, userId) => {
  const { name, description, repositoryUrl } = data;

  // Check for duplicate project name by same user
  const existing = await Project.findOne({
    name: name.trim(),
    createdBy: userId,
  });

  if (existing) {
    throw ApiError.conflict("You already have a project with this name");
  }

  const project = await Project.create({
    name,
    description,
    repositoryUrl,
    createdBy: userId,
    // Creator is automatically an admin member
    members: [{ user: userId, role: "admin" }],
  });

  logger.info(`Project created: "${project.name}" by user ${userId}`);

  return project;
};

/**
 * Get all projects the user has access to.
 * Admins see all projects. Others see only their projects.
 *
 * @param {string} userId
 * @param {string} userRole
 */
const getProjects = async (userId, userRole) => {
  let query = {};

  if (userRole !== "admin") {
    // Non-admins only see projects they are members of
    query = {
      $or: [{ createdBy: userId }, { "members.user": userId }],
    };
  }

  const projects = await Project.find(query)
    .populate("createdBy", "name email")
    .populate("members.user", "name email role")
    .sort({ createdAt: -1 });

  return projects;
};

/**
 * Get a single project by ID.
 * Verifies the user has access to it.
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {string} userRole
 */
const getProjectById = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId)
    .populate("createdBy", "name email")
    .populate("members.user", "name email role");

  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  // Check access — admins can see all, others must be members
  if (userRole !== "admin" && !project.isMember(userId)) {
    throw ApiError.forbidden("You do not have access to this project");
  }

  return project;
};

/**
 * Update a project.
 * Only the project creator or admin can update.
 *
 * @param {string} projectId
 * @param {Object} data - Fields to update
 * @param {string} userId
 * @param {string} userRole
 */
const updateProject = async (projectId, data, userId, userRole) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  // Only creator or system admin can update
  if (
    userRole !== "admin" &&
    project.createdBy.toString() !== userId.toString()
  ) {
    throw ApiError.forbidden("Only the project creator can update this project");
  }

  const allowedFields = ["name", "description", "status", "repositoryUrl"];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      project[field] = data[field];
    }
  });

  await project.save();

  logger.info(`Project updated: "${project.name}" by user ${userId}`);

  return project;
};

/**
 * Add a member to a project.
 *
 * @param {string} projectId
 * @param {string} newUserId - User to add
 * @param {string} role - Role to assign
 * @param {string} requesterId
 * @param {string} requesterRole
 */
const addMember = async (projectId, newUserId, role, requesterId, requesterRole) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  // Only creator or admin can add members
  if (
    requesterRole !== "admin" &&
    project.createdBy.toString() !== requesterId.toString()
  ) {
    throw ApiError.forbidden("Only the project creator can add members");
  }

  // Check if user is already a member
  const alreadyMember = project.members.some(
    (m) => m.user.toString() === newUserId.toString()
  );

  if (alreadyMember) {
    throw ApiError.conflict("User is already a member of this project");
  }

  project.members.push({ user: newUserId, role: role || "developer" });
  await project.save();

  return project.populate("members.user", "name email role");
};

/**
 * Delete a project.
 * Only the creator or system admin can delete.
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {string} userRole
 */
const deleteProject = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw ApiError.notFound("Project not found");
  }

  if (
    userRole !== "admin" &&
    project.createdBy.toString() !== userId.toString()
  ) {
    throw ApiError.forbidden("Only the project creator can delete this project");
  }

  await project.deleteOne();

  logger.info(`Project deleted: "${project.name}" by user ${userId}`);
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addMember,
  deleteProject,
};
