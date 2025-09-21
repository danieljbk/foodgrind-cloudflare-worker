// src/shared/cache.js

/**
 * Handles caching logic using R2 storage only
 * @param {string} key The cache key
 * @param {object} env Environment variables
 * @param {Function} generateFunction Function that generates the data if not cached
 * @param {string} contentType The content type for the data
 * @param {object} options Additional options for caching
 * @returns {Promise<any>} The cached or generated data
 */
export async function handleCache(key, env, generateFunction, contentType, options = {}) {
  try {
    // Check cache first
    const cachedData = await env.IMAGE_BUCKET.get(key);
    if (cachedData !== null) {
      console.log(`Cache HIT for key: "${key}"`);
      return cachedData;
    }

    // Generate if not cached
    console.log(`Cache MISS for key: "${key}". Generating new data.`);
    const result = await generateFunction();

    // Store in R2 cache
    await env.IMAGE_BUCKET.put(key, result, {
      httpMetadata: { contentType: contentType },
      ...options
    });

    console.log(`Successfully generated and cached data for key: "${key}"`);
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
  if (data && typeof data === 'object' && data.writeHttpMetadata) {
    // R2 object response
    const headers = new Headers();
    data.writeHttpMetadata(headers);
    headers.set("etag", data.httpEtag);
    return new Response(data.body, { headers });
  } else {
    // Direct data response
    return new Response(data, {
      headers: { "Content-Type": contentType },
    });
  }
}