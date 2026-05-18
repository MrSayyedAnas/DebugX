/**
 * @file comment.model.js
 * @description Mongoose schema for bug comments.
 *
 * Comments are stored as a SEPARATE collection (not embedded in Bug)
 * because:
 *   1. Bugs could have hundreds of comments — embedding bloats the document
 *   2. We can paginate comments independently
 *   3. We can query "all comments by user X" across all bugs
 */

"use strict";

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // ── Content ───────────────────────────────────────────────────────────────
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    // ── Relationships ─────────────────────────────────────────────────────────
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug",
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Edit Tracking ─────────────────────────────────────────────────────────
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
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
commentSchema.index({ bug: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
