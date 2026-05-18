/**
 * @file auth.middleware.js
 * @description JWT authentication and role-based access control middleware.
 *
 * TWO MIDDLEWARES IN THIS FILE:
 *
 *   1. `protect`      → Verifies JWT token, sets req.user
 *                       Use on ANY route that requires login
 *
 *   2. `authorize`    → Checks req.user.role against allowed roles
 *                       Use AFTER protect on role-restricted routes
 *
 * USAGE IN ROUTES:
 *   const { protect, authorize } = require('../middlewares/auth.middleware');
 *
 *   // Any logged-in user:
 *   router.get('/me', protect, authController.getMe);
 *
 *   // Only admins:
 *   router.delete('/users/:id', protect, authorize('admin'), userController.delete);
 *
 *   // Admins or developers:
 *   router.patch('/bugs/:id', protect, authorize('admin', 'developer'), bugController.update);
 */

"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const config = require("../config/env");

// ── protect ───────────────────────────────────────────────────────────────────

/**
 * Verifies the JWT token from the Authorization header.
 * On success: attaches decoded user to req.user and calls next().
 * On failure: throws 401 ApiError.
 *
 * Expected header format:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
const protect = async (req, res, next) => {
  try {
    // Step 1: Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized(
        "Access denied. No token provided. Use: Authorization: Bearer <token>"
      );
    }

    const token = authHeader.split(" ")[1]; // "Bearer <token>" → "<token>"

    // Step 2: Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Token has expired. Please login again.");
      }
      throw ApiError.unauthorized("Invalid token. Please login again.");
    }

    // Step 3: Check if user still exists in DB
    // (Handles case where user was deleted after token was issued)
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized(
        "The user belonging to this token no longer exists."
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated.");
    }

    // Step 4: Attach user to request object
    // Downstream middleware and controllers access this via req.user
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// ── authorize ─────────────────────────────────────────────────────────────────

/**
 * Role-based access control middleware factory.
 * Must be used AFTER `protect` (requires req.user to be set).
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'developer')
 * @returns {Function} Express middleware
 *
 * @example
 * // Only admins can access this route:
 * router.delete('/:id', protect, authorize('admin'), controller.delete);
 *
 * // Admins and developers can access:
 * router.patch('/:id', protect, authorize('admin', 'developer'), controller.update);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This should never happen if protect runs first
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { protect, authorize };
