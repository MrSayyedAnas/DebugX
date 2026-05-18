/**
 * @file ApiResponse.js
 * @description Standardized API response formatter.
 *
 * WHY STANDARDIZE RESPONSES:
 *   Without this, different endpoints might return:
 *     { data: ... }  OR  { result: ... }  OR  { bug: ... }
 *   This creates chaos for frontend developers and API consumers.
 *
 *   With ApiResponse, EVERY success response looks like:
 *   {
 *     "success": true,
 *     "statusCode": 200,
 *     "message": "Bugs fetched successfully",
 *     "data": { ... }
 *   }
 *
 * USAGE (in a controller):
 *   const { sendSuccess, sendPaginated } = require('../utils/ApiResponse');
 *
 *   // Simple response:
 *   sendSuccess(res, 200, 'Bug created', bug);
 *
 *   // Paginated response:
 *   sendPaginated(res, bugs, { page: 1, limit: 10, total: 100 });
 */

"use strict";

/**
 * Send a standard success response.
 *
 * @param {Object} res        - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message    - Human-readable success message
 * @param {*}      [data={}]  - Payload to return to the client
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
};

/**
 * Send a paginated list response.
 * Attaches pagination metadata separately from the data array.
 *
 * @param {Object} res        - Express response object
 * @param {Array}  data       - Array of results for current page
 * @param {Object} pagination - Pagination metadata
 * @param {number} pagination.page    - Current page number
 * @param {number} pagination.limit   - Items per page
 * @param {number} pagination.total   - Total item count across all pages
 * @param {string} [message]  - Optional message
 */
const sendPaginated = (
  res,
  data,
  { page, limit, total },
  message = "Data fetched successfully"
) => {
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { sendSuccess, sendPaginated };
