// src/shared/baseHandler.js

import { handleCache, createCachedResponse } from "./cache.js";
import { RequestDeduplicator } from "./deduplicator.js";
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from "./response.js";

/**
 * Base handler class for all request handlers
 */
export class BaseHandler {
  constructor() {
    this.deduplicator = new RequestDeduplicator();
  }

  /**
   * Validates the request key
   * @param {string} key The request key
   * @returns {Response|null} Validation error response or null if valid
   */
  validateKey(key) {
    if (!key || key === "favicon.ico") {
      return createValidationErrorResponse("Please provide a valid prompt.");
    }
    return null;
  }

  /**
   * Handles a request with caching and deduplication
   * @param {string} key The request key
   * @param {object} env Environment variables
   * @param {string} cacheType Either 'R2' or 'KV'
   * @param {Function} generateFunction Function that generates the data
   * @param {string} contentType The content type for responses
   * @returns {Promise<Response>} The response
   */
  async handleRequest(key, env, cacheType, generateFunction, contentType) {
    // Validate key first
    const validationError = this.validateKey(key);
    if (validationError) {
      return validationError;
    }

    try {
      // Handle deduplication
      const result = await this.deduplicator.handle(key, async () => {
        // Handle caching
        return await handleCache(key, env, cacheType, generateFunction);
      });

      // Return appropriate response based on cache type
      if (cacheType === 'R2') {
        // For R2, the result is already an R2Object
        return createCachedResponse(result, contentType);
      } else {
        // For KV, the result is the raw data
        return createSuccessResponse(result, contentType);
      }
    } catch (error) {
      return createErrorResponse(error, 500, "Handler");
    }
  }
}