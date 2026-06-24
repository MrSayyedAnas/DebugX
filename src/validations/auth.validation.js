/**
 * @file auth.validation.js
 * @description Joi validation schemas for authentication endpoints.
 *
 * WHY JOI VALIDATION:
 *   Without validation, a user could send:
 *     { email: "notanemail", password: "x" }
 *   And it would hit the database before failing.
 *
 *   Joi lets us define rules declaratively and reject bad
 *   requests BEFORE they touch any business logic or DB.
 *
 * HOW IT WORKS:
 *   Each schema is passed to the validate middleware.
 *   The middleware runs schema.validate(req.body) and either:
 *     - Passes to next() if valid
 *     - Throws ApiError(400, details) if invalid
 */

"use strict";

const Joi = require("joi");

// ── Reusable Field Definitions ─────────────────────────────────────────────────

const emailField = Joi.string()
  .email({ tlds: { allow: false } }) // Validate format without checking TLD list
  .lowercase()
  .trim()
  .required()
  .messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  });

const passwordField = Joi.string()
  .min(6)
  .max(100)
  .required()
  .messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  });

// ── Schemas ───────────────────────────────────────────────────────────────────

/**
 * Schema for POST /api/v1/auth/register
 */
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),

  email: emailField,

  password: passwordField,

  role: Joi.string()
    .valid("admin", "developer", "tester")
    .default("tester")
    .messages({
      "any.only": "Role must be one of: admin, developer, tester",
    }),
});

/**
 * Schema for POST /api/v1/auth/login
 */
const loginSchema = Joi.object({
  email: emailField,
  password: passwordField,
});

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  registerSchema,
  loginSchema,
};
