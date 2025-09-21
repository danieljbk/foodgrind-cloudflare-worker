// src/handlers/textHandler.js

import { BaseHandler } from "../shared/baseHandler.js";
import { generateWithAwsBedrock } from "../shared/awsBedrock.js";

/**
 * Text handler class for GPT text generation requests
 */
class TextHandler extends BaseHandler {
  /**
   * Generates text using AWS Bedrock with GPT model
   * @param {string} prompt The prompt for text generation
   * @param {object} env Environment variables
   * @returns {Promise<string>} The generated text
   */
  async generateText(prompt, env) {
    try {
      return await generateWithAwsBedrock(prompt, env, "GPT_OSS");
    } catch (error) {
      console.error("GPT Text Generation Error:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const textHandler = new TextHandler();

/**
 * Handles text generation requests using OpenAI GPT-OSS 120B.
 * Note: This handler is specifically designed for GPT requests.
 * For Claude requests, see claudeHandler.js
 * This handler is activated via the /gpt/ endpoint.
 * @param {string} key The prompt for text generation.
 * @param {object} env Environment variables.
 * @returns {Promise<Response>}
 */
export async function handleTextGeneration(key, env) {
  return await textHandler.handleRequest(
    key,
    env,
    'KV', // cacheType
    () => textHandler.generateText(key, env),
    "text/plain"
  );
}
