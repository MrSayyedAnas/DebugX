/**
 * @file validate.middleware.js
 * @description Reusable Joi validation middleware factory.
 *
 * HOW TO USE:
 *   const { validate } = require('../middlewares/validate.middleware');
 *   const { registerSchema } = require('../validations/auth.validation');
 *
 *   router.post('/register', validate(registerSchema), authController.register);
 *
 * This runs BEFORE the controller — invalid requests never reach business logic.
 */

"use strict";

const ApiError = require("../utils/ApiError");

/**
 * Returns an Express middleware that validates req.body against a Joi schema.
 *
 * On failure: throws ApiError(400) with all validation error details.
 * On success: calls next() and passes control to the next middleware/controller.
 *
 * @param {Object} schema - A Joi schema object
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,  // Collect ALL errors, not just the first one
    stripUnknown: true, // Remove fields not defined in schema (security)
    convert: true,      // Auto-convert types (e.g., string "true" → boolean)
  });

  if (error) {
    // Format Joi error details into clean array for the API response
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."), // e.g., "user.email" for nested fields
      message: detail.message.replace(/['"]/g, ""), // Remove Joi's quote wrapping
    }));

    throw ApiError.badRequest("Validation failed", errors);
  }

  // Replace req.body with the validated + sanitized value
  // (stripUnknown removed extra fields, convert fixed types)
  req.body = value;

  next();
};

module.exports = { validate };
