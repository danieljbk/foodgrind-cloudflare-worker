// src/shared/cache.js

import { createSha256Hash } from "../utils/crypto.js";

/**
 * Handles caching logic using R2 storage only
 * @param {string} key The cache key (e.g., the full user prompt)
 * @param {object} env Environment variables
 * @param {Function} generateFunction Function that generates the data if not cached
 * @param {string} contentType The content type for the data
 * @param {object} options Additional options for caching
 * @returns {Promise<any>} The cached or generated data
 */
export async function handleCache(
  key,
  env,
  generateFunction,
  contentType,
  options = {},
) {
  try {
    // Generate a deterministic, fixed-length key using a SHA256 hash.
    // This avoids issues with long prompts, special characters, and "folder" creation in R2.
    const storageKey = await createSha256Hash(key);

    // Check cache first
    const cachedObject = await env.IMAGE_BUCKET.get(storageKey);
    if (cachedObject !== null) {
      console.log(`Cache HIT for key (Hashed): "${storageKey}"`);
      // For text data, we need to read the contents with proper UTF-8 encoding
      if (contentType === "text/plain") {
        // Ensure we're reading the text with UTF-8 encoding
        const text = await cachedObject.text('utf-8');
        return text;
      }
      // For binary data (images), return the object directly
      return cachedObject;
    }

    // Generate if not cached
    console.log(
      `Cache MISS for key (Hashed): "${storageKey}". Generating new data.`,
    );
    const result = await generateFunction();

    // For text data, we need to convert it to a format that R2 can store properly
    let dataToStore = result;
    if (contentType === "text/plain" && typeof result === "string") {
      // Convert string to Uint8Array with explicit UTF-8 encoding for proper R2 storage
      const encoder = new TextEncoder();
      dataToStore = encoder.encode(result);
    }

    // Store in R2 cache with explicit UTF-8 content type
    await env.IMAGE_BUCKET.put(storageKey, dataToStore, {
      httpMetadata: { contentType: contentType + "; charset=utf-8" },
      ...options,
    });

    console.log(
      `Successfully generated and cached data for key (Hashed): "${storageKey}"`,
    );
    return result;
  } catch (error) {
    console.error("Cache Error:", error);
    throw error;
  }
}

/**
 * Creates a standardized response for cached data
 * @param {any} data The cached data
 * @param {string} contentType The content type for the response
 * @returns {Response} A standardized Response object
 */
export function createCachedResponse(data, contentType) {
  if (data && typeof data === "object" && data.writeHttpMetadata) {
    // R2 object response (image data)
    const headers = new Headers();
    data.writeHttpMetadata(headers);
    headers.set("etag", data.httpEtag);
    return new Response(data.body, { headers });
  } else {
    // Direct data response (text data or raw data)
    // Ensure proper UTF-8 encoding for text responses
    return new Response(data, {
      headers: { "Content-Type": contentType + "; charset=utf-8" },
    });
  }
}
