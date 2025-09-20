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
    const url = new URL(request.url);
    const path = url.pathname.slice(1).trim();

    if (path.startsWith("image/")) {
      const key = path.substring("image/".length);
      return handleImageGeneration(key, env);
    }

    if (path.startsWith("gpt/")) {
      const key = path.substring("gpt/".length);
      return handleTextGeneration(key, env);
    }

    if (path.startsWith("claude/")) {
      const key = path.substring("claude/".length);
      return handleClaudeTextGeneration(key, env);
    }

    return new Response(
      "Invalid request. Use /image/{prompt}, /gpt/{prompt}, or /claude/{prompt}.",
      {
        status: 400,
      },
    );
  },
};
