// src/shared/cache.js

/**
 * Handles caching logic for both R2 and KV storage
 * @param {string} key The cache key
 * @param {object} env Environment variables
 * @param {string} cacheType Either 'R2' or 'KV'
 * @param {Function} generateFunction Function that generates the data if not cached
 * @param {object} options Additional options for caching
 * @returns {Promise<any>} The cached or generated data
 */
export async function handleCache(key, env, cacheType, generateFunction, options = {}) {
  try {
    // Check cache first
    let cachedData;
    if (cacheType === 'R2') {
      cachedData = await env.IMAGE_BUCKET.get(key);
      if (cachedData !== null) {
        console.log(`Cache HIT for key: "${key}"`);
        return cachedData;
      }
    } else if (cacheType === 'KV') {
      cachedData = await env.TEXT_CACHE.get(key);
      if (cachedData !== null) {
        console.log(`Cache HIT for key: "${key}"`);
        return cachedData;
      }
    }

    // Generate if not cached
    console.log(`Cache MISS for key: "${key}". Generating new data.`);
    const result = await generateFunction();

    // Store in cache
    if (cacheType === 'R2') {
      await env.IMAGE_BUCKET.put(key, result, {
        httpMetadata: { contentType: "image/png" },
        ...options
      });
    } else if (cacheType === 'KV') {
      await env.TEXT_CACHE.put(key, result, {
        expirationTtl: 86400, // Cache for one day by default
        ...options
      });
    }

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
    // KV or other data response
    return new Response(data, {
      headers: { "Content-Type": contentType },
    });
  }
}