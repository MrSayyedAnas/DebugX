/**
 * @file stats.service.js
 * @description Dashboard statistics and analytics using MongoDB aggregation.
 *
 * WHY MONGODB AGGREGATION:
 *   Instead of fetching all documents and counting in JS,
 *   aggregation pipelines do the counting IN the database.
 *   Much faster, especially with large datasets.
 */

"use strict";

const Bug = require("../models/bug.model");
const Project = require("../models/project.model");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");

/**
 * Get dashboard statistics for a specific project.
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {string} userRole
 */
const getProjectStats = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw require("../utils/ApiError").notFound("Project not found");
  }

  // Run all aggregations in PARALLEL for performance
  const [
    statusStats,
    priorityStats,
    categoryStats,
    recentBugs,
    totalComments,
    assigneeStats,
  ] = await Promise.all([

    // ── Bugs by Status ──────────────────────────────────────────────────────
    Bug.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ── Bugs by Priority ────────────────────────────────────────────────────
    Bug.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ── Bugs by Category ────────────────────────────────────────────────────
    Bug.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ── 5 Most Recent Bugs ──────────────────────────────────────────────────
    Bug.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status priority createdAt")
      .populate("reportedBy", "name"),

    // ── Total Comments ──────────────────────────────────────────────────────
    Comment.countDocuments({
      bug: { $in: await Bug.find({ project: projectId }).distinct("_id") },
    }),

    // ── Bugs per Assignee ───────────────────────────────────────────────────
    Bug.aggregate([
      { $match: { project: project._id, assignedTo: { $ne: null } } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          count: 1,
          "user.name": 1,
          "user.email": 1,
        },
      },
    ]),
  ]);

  // ── Format Results ──────────────────────────────────────────────────────────
  const totalBugs = statusStats.reduce((sum, s) => sum + s.count, 0);

  // Convert array to object for easier frontend use
  // e.g., [{ _id: 'open', count: 5 }] → { open: 5 }
  const byStatus = statusStats.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const byPriority = priorityStats.reduce((acc, p) => {
    acc[p._id] = p.count;
    return acc;
  }, {});

  const byCategory = categoryStats.reduce((acc, c) => {
    acc[c._id] = c.count;
    return acc;
  }, {});

  return {
    project: {
      _id: project._id,
      name: project.name,
      status: project.status,
      memberCount: project.members.length,
    },
    bugs: {
      total: totalBugs,
      byStatus,
      byPriority,
      byCategory,
      recentBugs,
    },
    comments: {
      total: totalComments,
    },
    topAssignees: assigneeStats,
  };
};

/**
 * Get overall system stats (admin only).
 */
const getSystemStats = async () => {
  const [
    totalUsers,
    totalProjects,
    totalBugs,
    totalComments,
    bugsByStatus,
    bugsByPriority,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Project.countDocuments({ status: "active" }),
    Bug.countDocuments(),
    Comment.countDocuments(),

    Bug.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    Bug.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),

    // 10 most recently updated bugs across all projects
    Bug.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("title status priority updatedAt")
      .populate("project", "name")
      .populate("reportedBy", "name"),
  ]);

  return {
    overview: {
      totalUsers,
      totalProjects,
      totalBugs,
      totalComments,
    },
    bugsByStatus: bugsByStatus.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {}),
    bugsByPriority: bugsByPriority.reduce((acc, p) => {
      acc[p._id] = p.count;
      return acc;
    }, {}),
    recentActivity,
  };
};

module.exports = { getProjectStats, getSystemStats };
