/**
 * @file analytics.service.js
 * @description Developer analytics and productivity metrics.
 *
 * Covers DebugX Objective 2:
 *   "Developer analytics (resolution time, productivity, trends)
 *    to improve efficiency and decision-making in software teams"
 */

"use strict";

const Bug = require("../models/bug.model");
const Project = require("../models/project.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Convert milliseconds to human-readable duration.
 * e.g., 90000000ms → "1 day 1 hour"
 */
const msToDuration = (ms) => {
  if (!ms || ms <= 0) return "N/A";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * Get individual developer analytics.
 *
 * Metrics:
 *   - Total bugs assigned
 *   - Total bugs resolved
 *   - Resolution rate (%)
 *   - Average resolution time
 *   - Bugs by status
 *   - Bugs by priority
 *
 * @param {string} developerId
 * @param {string} projectId - Optional: scope to a project
 */
const getDeveloperAnalytics = async (developerId, projectId = null) => {
  // Verify developer exists
  const developer = await User.findById(developerId);
  if (!developer) throw ApiError.notFound("Developer not found");

  // Base match condition
  const matchCondition = { assignedTo: developer._id };
  if (projectId) matchCondition.project = require("mongoose").Types.ObjectId.createFromHexString(projectId);

  // Run all queries in parallel
  const [
    totalAssigned,
    totalResolved,
    totalClosed,
    bugsByStatus,
    bugsByPriority,
    resolvedBugs,
    recentActivity,
  ] = await Promise.all([

    // Total bugs assigned to this developer
    Bug.countDocuments(matchCondition),

    // Total resolved
    Bug.countDocuments({ ...matchCondition, status: "resolved" }),

    // Total closed
    Bug.countDocuments({ ...matchCondition, status: "closed" }),

    // Bugs grouped by status
    Bug.aggregate([
      { $match: matchCondition },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // Bugs grouped by priority
    Bug.aggregate([
      { $match: matchCondition },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),

    // Resolved bugs with timestamps for resolution time calculation
    Bug.find({
      ...matchCondition,
      status: { $in: ["resolved", "closed"] },
      resolvedAt: { $ne: null },
    }).select("createdAt resolvedAt title priority"),

    // 5 most recently updated bugs
    Bug.find(matchCondition)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status priority updatedAt")
      .populate("project", "name"),
  ]);

  // ── Calculate Resolution Time ─────────────────────────────────────────────
  let avgResolutionTimeMs = 0;
  let fastestResolutionMs = Infinity;
  let slowestResolutionMs = 0;

  if (resolvedBugs.length > 0) {
    const resolutionTimes = resolvedBugs.map((bug) => {
      return bug.resolvedAt - bug.createdAt; // ms difference
    });

    avgResolutionTimeMs = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    fastestResolutionMs = Math.min(...resolutionTimes);
    slowestResolutionMs = Math.max(...resolutionTimes);
  }

  // ── Resolution Rate ───────────────────────────────────────────────────────
  const resolutionRate = totalAssigned > 0
    ? Math.round(((totalResolved + totalClosed) / totalAssigned) * 100)
    : 0;

  return {
    developer: {
      _id: developer._id,
      name: developer.name,
      email: developer.email,
      role: developer.role,
    },
    metrics: {
      totalAssigned,
      totalResolved,
      totalClosed,
      totalPending: totalAssigned - totalResolved - totalClosed,
      resolutionRate: `${resolutionRate}%`,
    },
    resolutionTime: {
      average: msToDuration(avgResolutionTimeMs),
      fastest: fastestResolutionMs === Infinity ? "N/A" : msToDuration(fastestResolutionMs),
      slowest: msToDuration(slowestResolutionMs),
      averageMs: Math.round(avgResolutionTimeMs),
    },
    distribution: {
      byStatus: bugsByStatus.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      byPriority: bugsByPriority.reduce((acc, p) => {
        acc[p._id] = p.count;
        return acc;
      }, {}),
    },
    recentActivity,
  };
};

/**
 * Get bug trends over time for a project.
 *
 * Returns weekly bug creation and resolution counts
 * for the last N weeks.
 *
 * @param {string} projectId
 * @param {number} weeks - Number of weeks to look back (default: 8)
 */
const getBugTrends = async (projectId, weeks = 8) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const mongoose = require("mongoose");
  const projectObjId = mongoose.Types.ObjectId.createFromHexString(projectId);

  // Bugs created per week
  const [createdTrend, resolvedTrend] = await Promise.all([

    Bug.aggregate([
      {
        $match: {
          project: projectObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" },
          },
          count: { $sum: 1 },
          // Get the start of the week for display
          weekStart: { $min: "$createdAt" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]),

    Bug.aggregate([
      {
        $match: {
          project: projectObjId,
          resolvedAt: { $gte: startDate, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$resolvedAt" },
            week: { $week: "$resolvedAt" },
          },
          count: { $sum: 1 },
          weekStart: { $min: "$resolvedAt" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]),
  ]);

  // Format for frontend charting
  const formatTrend = (trend) =>
    trend.map((item) => ({
      week: `Week ${item._id.week}`,
      year: item._id.year,
      date: item.weekStart.toISOString().split("T")[0],
      count: item.count,
    }));

  return {
    project: { _id: project._id, name: project.name },
    period: {
      from: startDate.toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
      weeks,
    },
    trends: {
      created: formatTrend(createdTrend),
      resolved: formatTrend(resolvedTrend),
    },
  };
};

/**
 * Get full team performance for a project.
 *
 * Shows all developers with their metrics side by side.
 * Identifies top performer, fastest resolver, etc.
 *
 * @param {string} projectId
 */
const getTeamPerformance = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate("members.user", "name email role");

  if (!project) throw ApiError.notFound("Project not found");

  const mongoose = require("mongoose");
  const projectObjId = mongoose.Types.ObjectId.createFromHexString(projectId);

  // Get stats for ALL members in parallel
  const memberStats = await Bug.aggregate([
    { $match: { project: projectObjId, assignedTo: { $ne: null } } },
    {
      $group: {
        _id: "$assignedTo",
        totalAssigned: { $sum: 1 },
        totalResolved: {
          $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] },
        },
        totalOpen: {
          $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
        },
        totalInProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        // Average resolution time for resolved bugs
        avgResolutionMs: {
          $avg: {
            $cond: [
              { $ne: ["$resolvedAt", null] },
              { $subtract: ["$resolvedAt", "$createdAt"] },
              null,
            ],
          },
        },
      },
    },
    // Join with users collection
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "developer",
      },
    },
    { $unwind: "$developer" },
    {
      $project: {
        "developer.name": 1,
        "developer.email": 1,
        "developer.role": 1,
        totalAssigned: 1,
        totalResolved: 1,
        totalOpen: 1,
        totalInProgress: 1,
        avgResolutionMs: 1,
        resolutionRate: {
          $cond: [
            { $gt: ["$totalAssigned", 0] },
            {
              $multiply: [
                { $divide: ["$totalResolved", "$totalAssigned"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { resolutionRate: -1 } }, // Best performers first
  ]);

  // Format results
  const formattedStats = memberStats.map((stat) => ({
    developer: {
      _id: stat._id,
      name: stat.developer.name,
      email: stat.developer.email,
      role: stat.developer.role,
    },
    metrics: {
      totalAssigned: stat.totalAssigned,
      totalResolved: stat.totalResolved,
      totalOpen: stat.totalOpen,
      totalInProgress: stat.totalInProgress,
      resolutionRate: `${Math.round(stat.resolutionRate)}%`,
      avgResolutionTime: msToDuration(stat.avgResolutionMs),
    },
  }));

  // ── Identify Top Performers ───────────────────────────────────────────────
  const topPerformer = formattedStats[0] || null;
  const fastestResolver = [...formattedStats].sort((a, b) => {
    const aMs = memberStats.find(s => s._id.toString() === a.developer._id.toString())?.avgResolutionMs || Infinity;
    const bMs = memberStats.find(s => s._id.toString() === b.developer._id.toString())?.avgResolutionMs || Infinity;
    return aMs - bMs;
  })[0] || null;

  // Most active reporter
  const mostActiveReporter = await Bug.aggregate([
    { $match: { project: projectObjId } },
    { $group: { _id: "$reportedBy", bugsReported: { $sum: 1 } } },
    { $sort: { bugsReported: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $project: { "user.name": 1, "user.email": 1, bugsReported: 1 } },
  ]);

  return {
    project: { _id: project._id, name: project.name },
    teamSize: project.members.length,
    highlights: {
      topPerformer: topPerformer ? {
        name: topPerformer.developer.name,
        resolutionRate: topPerformer.metrics.resolutionRate,
      } : null,
      fastestResolver: fastestResolver ? {
        name: fastestResolver.developer.name,
        avgResolutionTime: fastestResolver.metrics.avgResolutionTime,
      } : null,
      mostActiveReporter: mostActiveReporter[0] ? {
        name: mostActiveReporter[0].user.name,
        bugsReported: mostActiveReporter[0].bugsReported,
      } : null,
    },
    teamStats: formattedStats,
  };
};

/**
 * Get full project analytics summary.
 * Combines all metrics into one comprehensive response.
 *
 * @param {string} projectId
 */
const getProjectAnalytics = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const mongoose = require("mongoose");
  const projectObjId = mongoose.Types.ObjectId.createFromHexString(projectId);

  const [
    totalBugs,
    openBugs,
    resolvedBugs,
    avgResolutionTime,
    bugsByCategory,
    bugsByPriority,
    bugsByStatus,
  ] = await Promise.all([
    Bug.countDocuments({ project: projectId }),
    Bug.countDocuments({ project: projectId, status: "open" }),
    Bug.countDocuments({ project: projectId, status: { $in: ["resolved", "closed"] } }),

    // Average resolution time for whole project
    Bug.aggregate([
      {
        $match: {
          project: projectObjId,
          resolvedAt: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } },
          minMs: { $min: { $subtract: ["$resolvedAt", "$createdAt"] } },
          maxMs: { $max: { $subtract: ["$resolvedAt", "$createdAt"] } },
        },
      },
    ]),

    Bug.aggregate([
      { $match: { project: projectObjId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Bug.aggregate([
      { $match: { project: projectObjId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Bug.aggregate([
      { $match: { project: projectObjId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const resolutionData = avgResolutionTime[0] || { avgMs: 0, minMs: 0, maxMs: 0 };
  const resolutionRate = totalBugs > 0
    ? Math.round((resolvedBugs / totalBugs) * 100)
    : 0;

  return {
    project: { _id: project._id, name: project.name, status: project.status },
    summary: {
      totalBugs,
      openBugs,
      resolvedBugs,
      pendingBugs: totalBugs - resolvedBugs,
      resolutionRate: `${resolutionRate}%`,
    },
    resolutionTime: {
      average: msToDuration(resolutionData.avgMs),
      fastest: msToDuration(resolutionData.minMs),
      slowest: msToDuration(resolutionData.maxMs),
    },
    distribution: {
      byStatus: bugsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byPriority: bugsByPriority.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      byCategory: bugsByCategory.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
    },
  };
};

module.exports = {
  getDeveloperAnalytics,
  getBugTrends,
  getTeamPerformance,
  getProjectAnalytics,
};
