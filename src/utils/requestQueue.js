// src/utils/requestQueue.js

/**
 * Request queue implementation to help prevent rate limiting
 * This queue helps manage concurrent requests to AWS Bedrock
 */

class RequestQueue {
  constructor(maxConcurrent = 3, retryDelay = 1000) {
    this.maxConcurrent = maxConcurrent;
    this.retryDelay = retryDelay;
    this.running = 0;
    this.queue = [];
  }

  /**
   * Add a request to the queue
   * @param {Function} fn - Function that returns a Promise
   * @returns {Promise<any>} Result of the function call
   */
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject
      });
      this.process();
    });
  }

  /**
   * Process the queue
   */
  async process() {
    // If we're at max concurrency or queue is empty, do nothing
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Take the next item from the queue
    const item = this.queue.shift();
    this.running++;

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.running--;
      // Process next item
      this.process();
    }
  }
}

// Create a single instance for all AWS Bedrock requests
export const awsRequestQueue = new RequestQueue(3, 1000);

/**
 * Execute a function with rate limiting and queuing
 * @param {Function} fn - Function to execute
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} Result of the function call
 */
export async function executeWithRateLimit(fn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      // Add to request queue
      return await awsRequestQueue.add(fn);
    } catch (error) {
      lastError = error;
      
      // If it's not a rate limiting error or we've exhausted retries
      if ((error.status !== 429 && error.status !== 403 && error.status !== 401) || i === maxRetries) {
        throw error;
      }
      
      console.log(`Rate limited. Retrying in ${awsRequestQueue.retryDelay}ms... (attempt ${i+1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, awsRequestQueue.retryDelay));
    }
  }
  
  throw lastError;
}