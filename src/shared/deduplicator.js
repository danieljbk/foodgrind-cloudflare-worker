// src/shared/deduplicator.js

/**
 * Generic deduplication utility to prevent duplicate requests
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Handles deduplication for a request
   * @param {string} key The request key
   * @param {Function} requestFunction Function that performs the actual request
   * @returns {Promise<any>} The result of the request
   */
  async handle(key, requestFunction) {
    if (this.pendingRequests.has(key)) {
      console.log(`Deduplicating request for key: "${key}"`);
      return await this.pendingRequests.get(key);
    }

    console.log(`Processing new request for key: "${key}"`);
    const promise = requestFunction();
    this.pendingRequests.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Checks if a request is already pending
   * @param {string} key The request key
   * @returns {boolean} True if the request is pending
   */
  isPending(key) {
    return this.pendingRequests.has(key);
  }

  /**
   * Gets the pending promise for a key
   * @param {string} key The request key
   * @returns {Promise|undefined} The pending promise or undefined
   */
  getPending(key) {
    return this.pendingRequests.get(key);
  }
}