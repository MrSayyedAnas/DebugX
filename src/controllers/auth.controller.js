/**
 * @file auth.controller.js
 * @description HTTP handler functions for authentication endpoints.
 *
 * CONTROLLER RESPONSIBILITY:
 *   1. Extract data from req (body, params, user)
 *   2. Call the appropriate service method
 *   3. Send a standardized response
 *
 * CONTROLLERS DO NOT:
 *   - Contain business logic (that's the service's job)
 *   - Query the database directly (that's the model's job)
 *   - Handle errors manually (errors bubble up to app.js error handler)
 *
 * All async errors are caught by the asyncHandler wrapper and
 * forwarded to the centralized error middleware in app.js.
 */

"use strict";

const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/ApiResponse");

// ── Async Handler Utility ─────────────────────────────────────────────────────

/**
 * Wraps async route handlers to catch errors and forward to Express
 * error middleware — eliminates repetitive try/catch in every controller.
 *
 * Instead of:
 *   async (req, res, next) => {
 *     try { ... } catch(e) { next(e) }
 *   }
 *
 * We write:
 *   asyncHandler(async (req, res) => { ... })
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 *
 * @body    { name, email, password, role? }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const { user, token } = await authService.register({
    name,
    email,
    password,
    role,
  });

  // 201 Created — resource was successfully created
  sendSuccess(res, 201, "User registered successfully", {
    user,
    token,
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and receive a JWT token
 * @access  Public
 *
 * @body    { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.login(email, password);

  sendSuccess(res, 200, "Login successful", {
    user,
    token,
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (requires JWT)
 *
 * req.user is set by the auth middleware after verifying the JWT token.
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user.id is injected by auth.middleware.js
  const user = await authService.getMe(req.user.id);

  sendSuccess(res, 200, "Profile fetched successfully", { user });
});

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  register,
  login,
  getMe,
};
