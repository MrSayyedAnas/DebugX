/**
 * @file auth.service.js
 * @description Business logic for authentication.
 *
 * WHY A SERVICE LAYER:
 *   Controllers handle HTTP (req/res).
 *   Services handle BUSINESS LOGIC.
 *
 *   This separation means:
 *   - Services can be unit tested without Express
 *   - Logic can be reused across multiple controllers
 *   - Controllers stay thin and readable
 *
 * RESPONSIBILITIES:
 *   - Register a new user
 *   - Login and return a JWT token
 *   - Get current user profile
 */

"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const config = require("../config/env");
const logger = require("../utils/logger");

// ── Token Generation ──────────────────────────────────────────────────────────

/**
 * Generates a signed JWT token for a user.
 *
 * PAYLOAD kept minimal — only what middleware needs:
 *   - id: to fetch full user from DB in auth middleware
 *   - role: for quick role checks without a DB hit
 *
 * @param {Object} user - Mongoose user document
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * Registers a new user.
 *
 * FLOW:
 *   1. Check if email already exists
 *   2. Create user (password hashing handled by model pre-save hook)
 *   3. Generate JWT token
 *   4. Return user + token
 *
 * @param {Object} userData - { name, email, password, role }
 * @returns {Promise<{ user: Object, token: string }>}
 * @throws {ApiError} 409 if email already registered
 */
const register = async ({ name, email, password, role }) => {
  // Step 1: Check for duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict("Email is already registered");
  }

  // Step 2: Create user
  // Note: password is hashed automatically by the pre-save hook in user.model.js
  const user = await User.create({
    name,
    email,
    password,
    role: role || "tester", // Default role if not provided
  });

  logger.info(`New user registered: ${user.email} [role: ${user.role}]`);

  // Step 3: Generate token
  const token = generateToken(user);

  // Step 4: Return user (password excluded by toJSON transform) + token
  return { user, token };
};

/**
 * Authenticates a user and returns a JWT token.
 *
 * FLOW:
 *   1. Find user by email (include password field)
 *   2. Verify password using bcrypt
 *   3. Update lastLoginAt timestamp
 *   4. Generate and return JWT token
 *
 * SECURITY NOTE:
 *   We return the SAME error message whether the email doesn't exist
 *   OR the password is wrong. This prevents "email enumeration" attacks
 *   where an attacker probes which emails are registered.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 * @throws {ApiError} 401 if credentials are invalid
 */
const login = async (email, password) => {
  // Step 1: Find user and explicitly select password (it's select: false by default)
  const user = await User.findByEmail(email); // Static method we defined on the model

  // Step 2: Verify credentials
  // Using the same error message for "user not found" and "wrong password"
  // to prevent email enumeration
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Check if account is active
  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated. Contact admin.");
  }

  // Step 3: Update last login timestamp (don't await — non-critical)
  User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

  logger.info(`User logged in: ${user.email}`);

  // Step 4: Generate token
  const token = generateToken(user);

  return { user, token };
};

/**
 * Retrieves the currently authenticated user's profile.
 *
 * The user ID comes from the decoded JWT token (set by auth middleware).
 * We re-fetch from DB to ensure we return fresh, complete data.
 *
 * @param {string} userId - MongoDB ObjectId from decoded JWT
 * @returns {Promise<Object>} User document (without password)
 * @throws {ApiError} 404 if user no longer exists
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return user;
};

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  register,
  login,
  getMe,
};
