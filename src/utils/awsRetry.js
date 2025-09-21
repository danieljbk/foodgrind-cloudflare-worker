// src/utils/awsRetry.js

/**
 * Calls an AWS function with exponential backoff retry logic
 * @param {Function} fn - Function that returns a Promise
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of the function call
 */
export async function callWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let delay = baseDelay;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // If it's not a rate limiting error (429) or we've exhausted retries
      if (error.status !== 429 || i === maxRetries) {
        throw error;
      }
      
      console.log(`AWS rate limited. Retrying in ${delay}ms... (attempt ${i+1}/${maxRetries})`);
      
      // Wait for the delay period
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next retry
    }
  }
}