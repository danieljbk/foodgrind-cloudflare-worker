// src/handlers/imageHandler.js

import { AwsClient } from "aws4fetch";
import { base64ToArrayBuffer } from "../utils/buffer.js";

/**
 * Handles image generation requests.
 * @param {string} key The prompt for image generation.
 * @param {object} env Environment variables.
 * @returns {Promise<Response>}
 */
export async function handleImageGeneration(key, env) {
  if (!key || key === "favicon.ico") {
    return new Response("Please provide a text prompt for the image.", {
      status: 400,
    });
  }

  try {
    // 1. Check for the image in the R2 cache first
    const cachedImage = await env.IMAGE_BUCKET.get(key);
    if (cachedImage !== null) {
      console.log(`Cache HIT for image key: "${key}"`);
      const headers = new Headers();
      cachedImage.writeHttpMetadata(headers);
      headers.set("etag", cachedImage.httpEtag);
      return new Response(cachedImage.body, { headers });
    }

    console.log(
      `Cache MISS for image key: "${key}". Generating with AWS Bedrock (Titan).`,
    );

    // 2. If not in cache, create a signed request for AWS Bedrock
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      service: "bedrock",
    });

    const modelId = "amazon.titan-image-generator-v2:0";
    const endpoint = `https://bedrock-runtime.${env.AWS_REGION}.amazonaws.com/model/${modelId}/invoke`;

    const requestBody = JSON.stringify({
      taskType: "TEXT_IMAGE",
      textToImageParams: { text: key },
      imageGenerationConfig: {
        numberOfImages: 1,
        quality: "standard",
        height: 1024,
        width: 1024,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 2147483647),
      },
    });

    const signedRequest = await aws.sign(endpoint, {
      method: "POST",
      body: requestBody,
      headers: { "Content-Type": "application/json" },
    });

    // 3. Fetch the image from Bedrock
    const response = await fetch(signedRequest);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bedrock API Error:", errorText);
      throw new Error(`Bedrock API Error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    const base64ImageData = responseData.images[0];
    const imageBuffer = base64ToArrayBuffer(base64ImageData);

    // 4. Store the newly generated image in the R2 cache
    await env.IMAGE_BUCKET.put(key, imageBuffer, {
      httpMetadata: { contentType: "image/png" },
    });
    console.log(`Successfully generated and cached image for key: "${key}"`);

    // 5. Return the image to the user
    return new Response(imageBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("Worker Error (Image Generation):", error);
    return new Response("An internal server error occurred.", { status: 500 });
  }
}
