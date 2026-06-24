"use strict";
const Joi = require("joi");

const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).allow("").default(""),
  repositoryUrl: Joi.string().uri().allow(null, "").default(null),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().max(500).allow(""),
  status: Joi.string().valid("active", "archived", "completed"),
  repositoryUrl: Joi.string().uri().allow(null, ""),
});

const addMemberSchema = Joi.object({
  userId: Joi.string().required().messages({ "any.required": "userId is required" }),
  role: Joi.string().valid("admin", "developer", "tester").default("developer"),
});

module.exports = { createProjectSchema, updateProjectSchema, addMemberSchema };