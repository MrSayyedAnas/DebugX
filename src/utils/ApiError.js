/**
 * @file ApiError.js
 * @description Custom error class for operational API errors.
 *
 * WHY A CUSTOM ERROR CLASS:
 *   Throwing plain `new Error('Not found')` loses HTTP context.
 *   With ApiError, you can throw:
 *     throw new ApiError(404, 'Bug not found');
 *   ...and the centralized error handler will automatically send the
 *   correct HTTP status code and formatted response.
 *
 * OPERATIONAL vs PROGRAMMER ERRORS:
 *   - isOperational = true  → Expected error (bad input, not found, etc.)
 *                             Show message to client.
 *   - isOperational = false → Unexpected bug in OUR code.
 *                             Log it, send generic "Internal Server Error".
 *
 * USAGE:
 *   const ApiError = require('../utils/ApiError');
 *
 *   // In a service or controller:
 *   throw new ApiError(404, 'Bug not found');
 *   throw new ApiError(400, 'Validation failed', errors);
 *   throw new ApiError(403, 'Forbidden');
 */

"use strict";

class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (400, 401, 403, 404, 409, 500...)
   * @param {string} message     - Human-readable error message
   * @param {Array}  [errors=[]] - Optional array of validation error details
   * @param {string} [stack='']  - Optional stack trace override
   */
  constructor(statusCode, message, errors = [], stack = "") {
    // Call parent Error constructor with the message
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors; // e.g., Joi validation error details
    this.success = false;
    this.isOperational = true; // Mark as expected/handled error

    // Capture stack trace, excluding the constructor call from it
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ── Static Factory Methods for Common Errors ─────────────────────────────
  // These make throw statements self-documenting:
  //   throw ApiError.notFound('Bug not found');
  //   throw ApiError.unauthorized();

  static badRequest(message = "Bad Request", errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }

  static internal(message = "Internal Server Error") {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
