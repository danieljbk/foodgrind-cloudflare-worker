// src/handlers/textHandler.js

import { AwsClient } from "aws4fetch";

/**
 * Handles text generation requests using Anthropic Claude 3.
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

    console.log(
      `Cache MISS for text key: "${key}". Generating with AWS Bedrock (Claude).`,
    );

    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      service: "bedrock",
    });

    // Ensure you are using the correct model ID for Claude
    const modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";
    const endpoint = `https://bedrock-runtime.${env.AWS_REGION}.amazonaws.com/model/${modelId}/invoke`;

    // --- THIS IS THE UPDATED PART FOR CLAUDE ---
    const requestBody = JSON.stringify({
      // A required field for Claude 3 models
      anthropic_version: "bedrock-2023-05-31",
      // All parameters are at the top level
      max_tokens: 2048,
      temperature: 0.7,
      // The prompt is now inside a 'messages' array
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

    // --- AND THE RESPONSE FORMAT IS DIFFERENT TOO ---
    // The generated text is in `content[0].text`
    const generatedText = responseData.content[0].text;

    // 4. Store the newly generated text in the KV cache
    // You can also set a TTL (time-to-live) for the cache, in seconds
    await env.TEXT_CACHE.put(key, generatedText, { expirationTtl: 86400 }); // Cache for one day (86400 seconds)

    console.log(`Successfully generated and cached text for key: "${key}"`);

    return new Response(generatedText, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Worker Error (Text Generation):", error);
    return new Response("An internal server error occurred.", { status: 500 });
  }
}
