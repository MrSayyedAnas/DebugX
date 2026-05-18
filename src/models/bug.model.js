/**
 * @file bug.model.js
 * @description Mongoose schema and model for the Bug entity.
 *
 * This is the core entity of DebugX.
 *
 * RELATIONSHIPS:
 *   - project    → ref: Project
 *   - reportedBy → ref: User (who found the bug)
 *   - assignedTo → ref: User (developer fixing it)
 *
 * AI FIELDS:
 *   - category   → auto-classified by Python AI service
 *   - priority   → auto-classified by Python AI service
 *
 * STATUS WORKFLOW:
 *   open → in_progress → resolved → closed
 *    └──────────── reopened ───────────────┘
 */

"use strict";

const mongoose = require("mongoose");

// ── Activity Log Sub-Schema ───────────────────────────────────────────────────
// Embedded in bug document — tracks every change made to a bug
const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g., "status_changed", "assigned", "priority_changed", "comment_added"
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // CI/CD actions have no user
      default: null,
    },
    details: {
      type: String, // Human-readable description of the change
      default: "",
    },
    // Store before/after values for history tracking (Phase 4)
    changes: {
      from: mongoose.Schema.Types.Mixed,
      to: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // createdAt = when this action happened
  }
);

// ── Main Bug Schema ───────────────────────────────────────────────────────────
const bugSchema = new mongoose.Schema(
  {
    // ── Core Fields ───────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Bug title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Bug description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // ── Classification ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["open", "in_progress", "resolved", "closed", "reopened"],
        message: "Invalid status value",
      },
      default: "open",
    },

    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "critical"],
        message: "Priority must be: low, medium, high, or critical",
      },
      default: "medium",
    },

    severity: {
      type: String,
      enum: {
        values: ["minor", "moderate", "major", "critical"],
        message: "Severity must be: minor, moderate, major, or critical",
      },
      default: "moderate",
    },

    // ── AI Classification ─────────────────────────────────────────────────────
    // These fields are populated by the Python AI microservice (Phase 5)
    category: {
      type: String,
      enum: {
        values: [
          "ui_bug",
          "performance",
          "security",
          "functionality",
          "database",
          "network",
          "other",
        ],
        message: "Invalid category",
      },
      default: "other",
    },

    aiClassified: {
      type: Boolean,
      default: false, // true once AI has processed this bug
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null, // Confidence score from AI model (0.0 - 1.0)
    },

    // ── Relationships ─────────────────────────────────────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Bug must belong to a project"],
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Bug must have a reporter"],
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Unassigned by default
    },

    // ── Additional Info ───────────────────────────────────────────────────────
    stepsToReproduce: {
      type: String,
      trim: true,
      maxlength: [2000, "Steps to reproduce cannot exceed 2000 characters"],
      default: "",
    },

    environment: {
      type: String,
      trim: true,
      maxlength: [200, "Environment cannot exceed 200 characters"],
      default: "", // e.g., "Chrome 120, Windows 11, Production"
    },

    tags: {
      type: [String],
      default: [],
      // e.g., ["login", "mobile", "critical"]
    },

    // ── CI/CD Integration ─────────────────────────────────────────────────────
    // Populated by GitHub Actions webhook (Phase 6)
    linkedCommit: {
      type: String,
      default: null, // Git commit SHA
    },

    linkedPR: {
      type: String,
      default: null, // GitHub PR URL
    },

    // ── Resolution ────────────────────────────────────────────────────────────
    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    // ── Activity Log ──────────────────────────────────────────────────────────
    // Embedded array — every action on this bug is recorded here
    activityLog: [activityLogSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
bugSchema.index({ project: 1, status: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ reportedBy: 1 });
bugSchema.index({ priority: 1 });
bugSchema.index({ createdAt: -1 });
// Full text search index (Phase 4)
bugSchema.index({ title: "text", description: "text", tags: "text" });

// ── Pre-Save Hook ─────────────────────────────────────────────────────────────

/**
 * Automatically set resolvedAt / closedAt timestamps
 * when status changes to resolved or closed.
 */
bugSchema.pre("save", function () {
  if (this.isModified("status")) {
    if (this.status === "resolved" && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === "closed" && !this.closedAt) {
      this.closedAt = new Date();
    }
    // Clear timestamps if bug is reopened
    if (this.status === "reopened") {
      this.resolvedAt = null;
      this.closedAt = null;
    }
  }
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Add an entry to the bug's activity log.
 * @param {string} action - Action type (e.g., "status_changed")
 * @param {string} userId - ID of user performing the action
 * @param {string} details - Human-readable description
 * @param {Object} changes - { from, to } values
 */
bugSchema.methods.logActivity = function (action, userId, details, changes = {}) {
  this.activityLog.push({
    action,
    performedBy: userId,
    details,
    changes,
  });
};

const Bug = mongoose.model("Bug", bugSchema);

module.exports = Bug;
