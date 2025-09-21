// src/utils/awsHelper.js

import { AwsClient } from "aws4fetch";

/**
 * Creates a new AWS client with the provided credentials
 * This ensures we have a fresh client for each request to avoid
 * signature issues in distributed environments like Cloudflare Workers
 * @param {object} env Environment variables containing AWS credentials
 * @returns {AwsClient} A new AWS client instance
 */
export function createAwsClient(env) {
  return new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    service: "bedrock",
  });
}

/**
 * Creates a signed request for AWS Bedrock with proper error handling
 * @param {AwsClient} awsClient The AWS client instance
 * @param {string} endpoint The AWS Bedrock endpoint URL
 * @param {string} body The request body as a JSON string
 * @returns {Promise<Request>} A signed request ready to be fetched
 */
export async function createSignedRequest(awsClient, endpoint, body) {
  return await awsClient.sign(endpoint, {
    method: "POST",
    body: body,
    headers: { "Content-Type": "application/json" },
  });
}