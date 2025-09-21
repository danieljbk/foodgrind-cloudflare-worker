// src/index.js

import { handleImageGeneration } from "./handlers/imageHandler.js";
import { handleTextGeneration } from "./handlers/textHandler.js";
import { handleClaudeTextGeneration } from "./handlers/claudeHandler.js";

export default {
  /**
   * @param {Request} request The incoming request.
   * @param {object} env Environment variables, secrets, and bindings.
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    // Add CORS headers for all responses
    const addCorsHeaders = (response) => {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
      return response;
    };

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      return addCorsHeaders(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname.slice(1).trim();

    try {
      if (path.startsWith("image/")) {
        const key = path.substring("image/".length);
        const response = await handleImageGeneration(key, env);
        return addCorsHeaders(response);
      }

      if (path.startsWith("gpt/")) {
        const key = path.substring("gpt/".length);
        const response = await handleTextGeneration(key, env);
        return addCorsHeaders(response);
      }

      if (path.startsWith("claude/")) {
        const key = path.substring("claude/".length);
        const response = await handleClaudeTextGeneration(key, env);
        return addCorsHeaders(response);
      }

      return addCorsHeaders(new Response(
        "Invalid request. Use /image/{prompt}, /gpt/{prompt}, or /claude/{prompt}.",
        {
          status: 400,
        },
      ));
    } catch (error) {
      console.error("Unhandled error in worker:", error);
      return addCorsHeaders(new Response(
        "An internal server error occurred.",
        { 
          status: 500,
          headers: { "Content-Type": "text/plain" }
        },
      ));
    }
  },
};
