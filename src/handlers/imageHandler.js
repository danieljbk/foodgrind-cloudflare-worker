// src/handlers/imageHandler.js

import { base64ToArrayBuffer } from "../utils/buffer.js";
import { BaseHandler } from "../shared/baseHandler.js";
import { generateWithAwsBedrock } from "../shared/awsBedrock.js";

/**
 * Image handler class for image generation requests
 */
class ImageHandler extends BaseHandler {
  /**
   * Generates an image using AWS Bedrock
   * @param {string} prompt The prompt for image generation
   * @param {object} env Environment variables
   * @returns {Promise<ArrayBuffer>} The generated image as an ArrayBuffer
   */
  async generateImage(prompt, env) {
    try {
      const base64ImageData = await generateWithAwsBedrock(prompt, env, "TITAN_IMAGE");
      return base64ToArrayBuffer(base64ImageData);
    } catch (error) {
      console.error("Image Generation Error:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const imageHandler = new ImageHandler();

/**
 * Handles image generation requests.
 * @param {string} key The prompt for image generation.
 * @param {object} env Environment variables.
 * @returns {Promise<Response>}
 */
export async function handleImageGeneration(key, env) {
  return await imageHandler.handleRequest(
    key,
    env,
    () => imageHandler.generateImage(key, env),
    "image/png"
  );
}
