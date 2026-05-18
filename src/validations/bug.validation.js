"use strict";
const Joi = require("joi");

const createBugSchema = Joi.object({
  projectId: Joi.string().required().messages({ "any.required": "projectId is required" }),
  title: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  priority: Joi.string().valid("low", "medium", "high", "critical").default("medium"),
  severity: Joi.string().valid("minor", "moderate", "major", "critical").default("moderate"),
  category: Joi.string()
    .valid("ui_bug", "performance", "security", "functionality", "database", "network", "other")
    .default("other"),
  stepsToReproduce: Joi.string().trim().max(2000).allow("").default(""),
  environment: Joi.string().trim().max(200).allow("").default(""),
  tags: Joi.array().items(Joi.string().trim()).default([]),
});

const updateBugSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  description: Joi.string().trim().min(10).max(5000),
  priority: Joi.string().valid("low", "medium", "high", "critical"),
  severity: Joi.string().valid("minor", "moderate", "major", "critical"),
  category: Joi.string().valid(
    "ui_bug", "performance", "security",
    "functionality", "database", "network", "other"
  ),
  stepsToReproduce: Joi.string().trim().max(2000).allow(""),
  environment: Joi.string().trim().max(200).allow(""),
  tags: Joi.array().items(Joi.string().trim()),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed", "reopened")
    .required()
    .messages({ "any.required": "status is required" }),
});

const assignBugSchema = Joi.object({
  assigneeId: Joi.string().required().messages({ "any.required": "assigneeId is required" }),
});

const addCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required()
    .messages({ "any.required": "Comment content is required" }),
});

module.exports = {
  createBugSchema,
  updateBugSchema,
  updateStatusSchema,
  assignBugSchema,
  addCommentSchema,
};