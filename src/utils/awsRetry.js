// src/utils/awsRetry.js

/**
 * Calls an AWS function with exponential backoff retry logic
 * @param {Function} fn - Function that returns a Promise
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of the function call
 */
export async function callWithBackoff(fn, maxRetries = 5, baseDelay = 1000) {
  let delay = baseDelay;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Log detailed error information
      console.error(`AWS Call failed (attempt ${i+1}/${maxRetries + 1}):`, {
        status: error.status,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // If it's not a rate limiting error (429) or auth errors, or we've exhausted retries
      if ((error.status !== 429 && error.status !== 403 && error.status !== 401) || i === maxRetries) {
        throw error;
      }
      
      console.log(`AWS rate limited or auth error. Retrying in ${delay}ms... (attempt ${i+1}/${maxRetries})`);
      
      // Wait for the delay period
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next retry
    }
  }
}