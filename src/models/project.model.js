/**
 * @file project.model.js
 * @description Mongoose schema and model for the Project entity.
 *
 * A Project is the top-level container for bugs.
 * Every bug belongs to exactly one project.
 *
 * RELATIONSHIPS:
 *   - createdBy  → ref: User (admin who created the project)
 *   - members    → ref: User[] (users who can access this project)
 */

"use strict";

const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // ── Core Fields ───────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [3, "Project name must be at least 3 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["active", "archived", "completed"],
        message: "Status must be one of: active, archived, completed",
      },
      default: "active",
    },

    // ── Ownership ─────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Team Members ──────────────────────────────────────────────────────────
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "developer", "tester"],
          default: "developer",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Repository Integration ─────────────────────────────────────────────
    repositoryUrl: {
      type: String,
      trim: true,
      default: null,
    },
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
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: "text", description: "text" });

// ── Instance Methods ──────────────────────────────────────────────────────────
projectSchema.methods.isMember = function (userId) {
  return (
    this.members.some((m) => m.user.toString() === userId.toString()) ||
    this.createdBy.toString() === userId.toString()
  );
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
