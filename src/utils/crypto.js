// src/utils/crypto.js

/**
 * Creates a truncated SHA256 hash for a given string using the Web Crypto API.
 * This is ideal for creating consistent, safe, and fixed-length keys for storage systems like R2.
 * @param {string} text The string to hash.
 * @param {number} length The desired length of the truncated hex string (default: 32).
 * @returns {Promise<string>} The truncated SHA256 hash as a hex string.
 */
export async function createSha256Hash(text, length = 32) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hexHash.substring(0, length);
}
