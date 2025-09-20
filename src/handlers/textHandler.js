// src/handlers/textHandler.js

import { AwsClient } from "aws4fetch";
import { callWithBackoff } from "../utils/awsRetry.js";

// Map to track pending requests to prevent duplicate AWS calls
const pendingTextRequests = new Map();

/**
 * Handles text generation requests using OpenAI GPT-OSS 120B.
 * @param {string} key The prompt for text generation.
 * @param {object} env Environment variables.
 * @returns {Promise<Response>}
 */
export async function handleTextGeneration(key, env) {
  if (!key) {
    return new Response("Please provide a text prompt for text generation.", {
      status: 400,
    });
  }

  try {
    // 1. Check for the text in the KV cache first
    const cachedText = await env.TEXT_CACHE.get(key);
    if (cachedText !== null) {
      console.log(`Cache HIT for text key: "${key}"`);
      return new Response(cachedText, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. Check if there's already a pending request for this key
    if (pendingTextRequests.has(key)) {
      console.log(`Deduplicating request for text key: "${key}"`);
      const generatedText = await pendingTextRequests.get(key);
      return new Response(generatedText, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.log(
      `Cache MISS for text key: "${key}". Generating with AWS Bedrock.`,
    );

    // 3. Create a promise for the AWS call and store it
    const textPromise = generateTextWithAWS(key, env);
    pendingTextRequests.set(key, textPromise);

    try {
      const generatedText = await textPromise;

      // 4. Store the newly generated text in the KV cache
      // You can also set a TTL (time-to-live) for the cache, in seconds
      await env.TEXT_CACHE.put(key, generatedText, { expirationTtl: 86400 }); // Cache for one day (86400 seconds)

      console.log(`Successfully generated and cached text for key: "${key}"`);

      return new Response(generatedText, {
        headers: { "Content-Type": "text/plain" },
      });
    } finally {
      // Remove the pending request
      pendingTextRequests.delete(key);
    }
  } catch (error) {
    console.error("Worker Error (Text Generation):", error);
    return new Response("An internal server error occurred.", { status: 500 });
  }
}

/**
 * Generate text with AWS Bedrock
 * @param {string} key The prompt for text generation.
 * @param {object} env Environment variables.
 * @returns {Promise<string>}
 */
async function generateTextWithAWS(key, env) {
  return callWithBackoff(async () => {
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      service: "bedrock",
    });

    // Ensure you are using the correct model ID
    const modelId = "openai.gpt-oss-120b-1:0";
    const endpoint = `https://bedrock-runtime.${env.AWS_REGION}.amazonaws.com/model/${modelId}/invoke`;

    // Format for OpenAI GPT model on AWS Bedrock
    const requestBody = JSON.stringify({
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: key,
            },
          ],
        },
      ],
    });

    const signedRequest = await aws.sign(endpoint, {
      method: "POST",
      body: requestBody,
      headers: { "Content-Type": "application/json" },
    });

    const response = await fetch(signedRequest);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bedrock API Error:", errorText);
      throw new Error(`Bedrock API Error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();

    // Extract the generated text from the response
    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      let content = responseData.choices[0].message.content;
      // Remove reasoning tags if present
      content = content.replace(/<reasoning>.*?<\/reasoning>/g, '');
      return content.trim();
    } else {
      throw new Error("Unexpected response format: " + JSON.stringify(responseData));
    }
  });
}
