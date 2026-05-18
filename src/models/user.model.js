/**
 * @file user.model.js
 * @description Mongoose schema and model for the User entity.
 *
 * DESIGN DECISIONS:
 *   1. Password uses `select: false` — never returned in queries by default
 *   2. Pre-save hook hashes password — business logic lives in the model
 *      for password specifically (it's tightly coupled to the field)
 *   3. Instance method `comparePassword` keeps bcrypt logic here, not
 *      scattered across services
 *   4. Role enum enforced at DB level — invalid roles are rejected
 *   5. email is lowercase + trimmed to prevent duplicate accounts
 *      from "User@email.com" vs "user@email.com"
 */

"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Schema Definition ─────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,        // Creates a MongoDB unique index
      lowercase: true,     // Always store as lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    // ── Authentication ────────────────────────────────────────────────────────
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // CRITICAL: Never return password in query results
    },

    // ── Authorization ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["admin", "developer", "tester"],
        message: "Role must be one of: admin, developer, tester",
      },
      default: "tester",
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    avatar: {
      type: String,
      default: null, // URL to profile picture (optional)
    },

    isActive: {
      type: Boolean,
      default: true, // Allows soft-disabling accounts without deletion
    },

    // ── Tracking ──────────────────────────────────────────────────────────────
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,

    // When converting to JSON (e.g., res.json(user)), apply these transforms
    toJSON: {
      transform(doc, ret) {
        // Remove sensitive/internal fields from all API responses
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Index on email for fast lookup during login.
 * `unique: true` above already creates an index, but we define it
 * explicitly here for clarity and to add the sparse option.
 */
userSchema.index({ role: 1 }); // Useful for admin queries like "list all developers"

// ── Pre-Save Hook: Password Hashing ──────────────────────────────────────────

/**
 * Automatically hashes the password before saving to DB.
 *
 * IMPORTANT: Only runs if password was modified.
 * This prevents re-hashing an already-hashed password
 * when other fields (like name) are updated.
 *
 * Salt rounds = 12 → good balance of security vs performance.
 * (10 is minimum acceptable, 14+ is overkill for most apps)
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Compares a plain-text password against the stored hash.
 *
 * Usage (in auth service):
 *   const isMatch = await user.comparePassword('plainTextPassword');
 *
 * WHY AN INSTANCE METHOD:
 *   Keeps bcrypt logic tied to the model, not scattered in services.
 *   Any code that has a user document can call this.
 *
 * @param {string} candidatePassword - The plain text password to check
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Note: `this.password` works here even with `select: false`
  // because we explicitly selected it in the service query
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Static Methods ────────────────────────────────────────────────────────────

/**
 * Find a user by email and explicitly include the password field.
 * Used during login — the only time we need the password hash.
 *
 * Usage (in auth service):
 *   const user = await User.findByEmail('user@example.com');
 *
 * @param {string} email
 * @returns {Promise<Document|null>}
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

// ── Model Export ──────────────────────────────────────────────────────────────

const User = mongoose.model("User", userSchema);

module.exports = User;
