/**
 * @file queryBuilder.js
 * @description Reusable MongoDB query builder for filtering, sorting,
 * pagination, and search.
 *
 * WHY THIS EXISTS:
 *   Without this, every service method would have 50+ lines of query
 *   building logic repeated everywhere. This utility centralizes it.
 *
 * USAGE:
 *   const { buildQuery, paginate } = require('../utils/queryBuilder');
 *
 *   const { filter, sort, pagination } = buildQuery(req.query, allowedFilters);
 *   const { data, meta } = await paginate(Bug, filter, sort, pagination, populate);
 */

"use strict";

/**
 * Builds a MongoDB filter, sort, and pagination object from query params.
 *
 * @param {Object} queryParams - req.query object
 * @param {Array}  allowedFilters - Fields allowed for filtering
 * @returns {{ filter, sort, pagination }}
 *
 * @example
 * // URL: /bugs?status=open&priority=high&page=2&limit=10&sort=-createdAt&search=login
 * buildQuery(req.query, ['status', 'priority', 'category', 'assignedTo'])
 */
const buildQuery = (queryParams, allowedFilters = []) => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt", // Default: newest first
    search,
    startDate,
    endDate,
    ...rest
  } = queryParams;

  // ── Filter Building ─────────────────────────────────────────────────────────
  const filter = {};

  // Only allow explicitly whitelisted filter fields
  // Prevents users from filtering on internal fields like __v, password etc.
  allowedFilters.forEach((field) => {
    if (rest[field] !== undefined && rest[field] !== "") {
      filter[field] = rest[field];
    }
  });

  // ── Date Range Filter ───────────────────────────────────────────────────────
  // Usage: ?startDate=2024-01-01&endDate=2024-12-31
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  // Uses MongoDB text index for full-text search
  // Requires text index on the model (already defined in bug.model.js)
  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  // ── Sort Building ───────────────────────────────────────────────────────────
  // Supports: sort=createdAt (asc) or sort=-createdAt (desc)
  // Multiple fields: sort=-priority,createdAt
  const sortObj = {};
  const sortFields = sort.split(",");

  sortFields.forEach((field) => {
    if (field.startsWith("-")) {
      sortObj[field.substring(1)] = -1; // Descending
    } else {
      sortObj[field] = 1; // Ascending
    }
  });

  // ── Pagination ──────────────────────────────────────────────────────────────
  const pageNum = Math.max(1, parseInt(page, 10));       // Min page: 1
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // 1-100
  const skip = (pageNum - 1) * limitNum;

  return {
    filter,
    sort: sortObj,
    pagination: {
      page: pageNum,
      limit: limitNum,
      skip,
    },
  };
};

/**
 * Executes a paginated MongoDB query and returns data + metadata.
 *
 * @param {Model}  Model      - Mongoose model to query
 * @param {Object} filter     - MongoDB filter object
 * @param {Object} sort       - MongoDB sort object
 * @param {Object} pagination - { page, limit, skip }
 * @param {Array}  populate   - Array of populate configs
 * @param {string} select     - Fields to select/exclude
 *
 * @returns {{ data, meta }}
 *
 * @example
 * const result = await paginate(
 *   Bug,
 *   { project: projectId, status: 'open' },
 *   { createdAt: -1 },
 *   { page: 1, limit: 10, skip: 0 },
 *   [{ path: 'reportedBy', select: 'name email' }]
 * );
 */
const paginate = async (Model, filter, sort, pagination, populate = [], select = "") => {
  const { page, limit, skip } = pagination;

  // Run count and data queries in PARALLEL for performance
  const [total, data] = await Promise.all([
    Model.countDocuments(filter),
    Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select || ""),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { buildQuery, paginate };
