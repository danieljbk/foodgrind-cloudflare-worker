// src/handlers/claudeHandler.js

import { BaseHandler } from "../shared/baseHandler.js";
import { generateWithAwsBedrock } from "../shared/awsBedrock.js";

/**
 * Claude handler class for Claude text generation requests
 */
class ClaudeHandler extends BaseHandler {
  /**
   * Generates text using AWS Bedrock with Claude model
   * @param {string} prompt The prompt for text generation
   * @param {object} env Environment variables
   * @returns {Promise<string>} The generated text
   */
  async generateText(prompt, env) {
    try {
      return await generateWithAwsBedrock(prompt, env, "CLAUDE_SONNET");
    } catch (error) {
      console.error("Claude Text Generation Error:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const claudeHandler = new ClaudeHandler();

/**
 * Handles text generation requests using Anthropic Claude 4 Sonnet.
 * @param {string} key The prompt for text generation.
 * @param {object} env Environment variables.
 * @returns {Promise<Response>}
 */
export async function handleClaudeTextGeneration(key, env) {
  return await claudeHandler.handleRequest(
    key,
    env,
    'KV', // cacheType
    () => claudeHandler.generateText(key, env),
    "text/plain"
  );
}
