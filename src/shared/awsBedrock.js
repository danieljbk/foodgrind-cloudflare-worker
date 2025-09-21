// src/shared/awsBedrock.js

import { createAwsClient, createSignedRequest } from "../utils/awsHelper.js";

/**
 * Configuration for different AWS Bedrock models
 */
const MODEL_CONFIGS = {
  TITAN_IMAGE: {
    modelId: "amazon.titan-image-generator-v2:0",
    formatRequest: (prompt) => ({
      taskType: "TEXT_IMAGE",
      textToImageParams: { text: prompt },
      imageGenerationConfig: {
        numberOfImages: 1,
        quality: "standard",
        height: 1024,
        width: 1024,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 2147483647),
      },
    }),
    parseResponse: (responseData) => {
      if (responseData.images && responseData.images[0]) {
        return responseData.images[0];
      }
      throw new Error("Unexpected image response format: " + JSON.stringify(responseData));
    }
  },
  GPT_OSS: {
    modelId: "openai.gpt-oss-120b-1:0",
    formatRequest: (prompt) => ({
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
    parseResponse: (responseData) => {
      if (
        responseData.choices &&
        responseData.choices[0] &&
        responseData.choices[0].message
      ) {
        let content = responseData.choices[0].message.content;
        // Remove reasoning tags if present
        content = content.replace(/<reasoning>.*?<\/reasoning>/g, "");
        return content.trim();
      }
      throw new Error("Unexpected GPT response format: " + JSON.stringify(responseData));
    }
  },
  CLAUDE_SONNET: {
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    formatRequest: (prompt) => ({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
    parseResponse: (responseData) => {
      if (
        responseData.content &&
        responseData.content[0] &&
        responseData.content[0].text
      ) {
        return responseData.content[0].text.trim();
      }
      throw new Error("Unexpected Claude response format: " + JSON.stringify(responseData));
    }
  }
};

/**
 * Generates content using AWS Bedrock
 * @param {string} prompt The prompt for generation
 * @param {object} env Environment variables
 * @param {string} modelType The model type (TITAN_IMAGE, GPT_OSS, CLAUDE_SONNET)
 * @returns {Promise<any>} The generated content
 */
export async function generateWithAwsBedrock(prompt, env, modelType) {
  const config = MODEL_CONFIGS[modelType];
  if (!config) {
    throw new Error(`Unsupported model type: ${modelType}`);
  }

  // Create a new AWS client for each request to avoid state-related signing issues.
  const aws = createAwsClient(env);

  const endpoint = `https://bedrock-runtime.${env.AWS_REGION}.amazonaws.com/model/${config.modelId}/invoke`;
  const requestBody = JSON.stringify(config.formatRequest(prompt));
  const signedRequest = await createSignedRequest(aws, endpoint, requestBody);

  const response = await fetch(signedRequest);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Bedrock API Error:", errorText);
    console.error("Response Status:", response.status);
    console.error("Response Headers:", [...response.headers]);

    // Special handling for authentication errors
    if (response.status === 403 || response.status === 401) {
      console.error(
        "Authentication error with AWS Bedrock. This may be due to signature issues in distributed environments."
      );
      throw new Error(
        `AWS Authentication Error: ${response.status} - ${errorText}. This may occur when requests are routed to different edge locations.`
      );
    }

    throw new Error(`Bedrock API Error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  return config.parseResponse(responseData);
}