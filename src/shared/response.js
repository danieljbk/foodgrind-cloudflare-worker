// src/shared/response.js

/**
 * Creates a standardized success response
 * @param {any} data The response data
 * @param {string} contentType The content type for the response
 * @returns {Response} A standardized Response object
 */
export function createSuccessResponse(data, contentType) {
  // Ensure proper UTF-8 encoding for text responses
  const finalContentType = contentType.includes('text/') && !contentType.includes('charset') 
    ? contentType + "; charset=utf-8" 
    : contentType;
    
  return new Response(data, {
    headers: { "Content-Type": finalContentType },
  });
}

/**
 * Creates a standardized error response
 * @param {Error|string} error The error object or message
 * @param {number} status The HTTP status code (default: 500)
 * @param {string} context Optional context for logging
 * @returns {Response} A standardized error Response object
 */
export function createErrorResponse(error, status = 500, context = "") {
  const errorMessage = error.message || error.toString();
  if (context) {
    console.error(`${context} Error:`, error);
  } else {
    console.error("Error:", error);
  }
  return new Response(`An internal server error occurred: ${errorMessage}`, {
    status: status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Creates a standardized validation error response
 * @param {string} message The validation error message
 * @returns {Response} A standardized validation error Response object
 */
export function createValidationErrorResponse(message) {
  return new Response(message, {
    status: 400,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Adds CORS headers to a response
 * @param {Response} response The response to add headers to
 * @returns {Response} The response with CORS headers
 */
export function addCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}