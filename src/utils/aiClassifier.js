/**
 * @file aiClassifier.js
 * @description Node.js client for the DebugX Python AI microservice.
 *
 * Called automatically when a new bug is created.
 * If AI service is unavailable, bug is saved without classification
 * (graceful degradation — system works even if AI is down).
 */

"use strict";

const config = require("../config/env");
const logger = require("./logger");

/**
 * Calls the Python AI service to classify a bug.
 *
 * @param {string} bugId  - MongoDB bug ID to update after classification
 * @param {string} title  - Bug title
 * @param {string} description - Bug description
 * @returns {Promise<Object|null>} Classification result or null if failed
 */
const classifyBug = async (bugId, title, description) => {
  try {
    const response = await fetch(`${config.aiServiceUrl}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "AI classification failed");
    }

    // Update the bug with AI classification results
    const Bug = require("../models/bug.model");
    await Bug.findByIdAndUpdate(bugId, {
      category: data.data.category,
      priority: data.data.priority,
      aiClassified: true,
      aiConfidence: data.data.confidence,
    });

    logger.info(
      `Bug ${bugId} classified: category=${data.data.category}, ` +
      `priority=${data.data.priority}, confidence=${data.data.confidence}`
    );

    return data.data;

  } catch (error) {
    // Graceful degradation — log but don't crash
    logger.warn(`AI classification failed for bug ${bugId}: ${error.message}`);
    return null;
  }
};

module.exports = { classifyBug };
