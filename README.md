# Foodgrind Image and Text Generation API

This API, hosted on Cloudflare Workers, provides endpoints for generating images and text based on user-provided prompts. It leverages Amazon Bedrock for generative AI capabilities, Cloudflare R2 for image caching, and Cloudflare KV for text caching.

## Features

-   **Image Generation**: Generate images from text prompts using Amazon Titan Image Generator V2.
-   **Text Generation**: Generate text from prompts using Anthropic Claude 3.5 Sonnet.
-   **Caching**: Caches generated images in Cloudflare R2 and text in Cloudflare KV to reduce latency and cost on subsequent requests with the same prompt.

## Technology Stack

-   **Runtime**: Cloudflare Workers
-   **AI Models**:
    -   Image: Amazon Titan Image Generator V2 (via AWS Bedrock)
    -   Text: Anthropic Claude 3.5 Sonnet (via AWS Bedrock)
-   **Storage**:
    -   Image Cache: Cloudflare R2
    -   Text Cache: Cloudflare KV
-   **Dependencies**:
    -   `aws4fetch`: For signing requests to AWS.

## API Endpoints

### Image Generation

-   **Method**: `GET`
-   **Endpoint**: `/image/{prompt}`
-   **Description**: Generates an image based on the provided `{prompt}`. The first request for a given prompt will generate a new image and cache it in R2. Subsequent requests for the same prompt will return the cached image.
-   **URL Parameters**:
    -   `prompt` (required): The text prompt to use for image generation.
-   **Example Usage (cURL)**:
    ```bash
    curl -X GET "https://your-worker-url.workers.dev/image/a%20photo%20of%20a%20cat%20wearing%20a%20hat" -o cat.png
    ```
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content**: The generated image in PNG format.
-   **Error Response**:
    -   **Code**: `400 Bad Request` if no prompt is provided.
    -   **Code**: `500 Internal Server Error` for any other errors.

### Text Generation

-   **Method**: `GET`
-   **Endpoint**: `/text/{prompt}`
-   **Description**: Generates text based on the provided `{prompt}`. The first request for a given prompt will generate new text and cache it in KV. Subsequent requests for the same prompt will return the cached text.
-   **URL Parameters**:
    -   `prompt` (required): The text prompt to use for text generation.
-   **Example Usage (cURL)**:
    ```bash
    curl -X GET "https://your-worker-url.workers.dev/text/write%20a%20short%20story%20about%20a%20robot"
    ```
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Content**: The generated text in plain text format.
-   **Error Response**:
    -   **Code**: `400 Bad Request` if no prompt is provided.
    -   **Code**: `500 Internal Server Error` for any other errors.

## Setup and Deployment

### Prerequisites

-   A Cloudflare account.
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed.
-   An AWS account with access to Amazon Bedrock.

### Configuration

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd foodgrind-image-generator
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure `wrangler.toml`**:
    -   The `wrangler.toml` file is pre-configured to use an R2 bucket named `foodgrind-image-storage` and a KV namespace with the ID `9f7892da1d90486196e588cff983712f`. You may need to create these in your Cloudflare account and update the configuration accordingly.

4.  **Set up environment variables**:
    -   You need to create a `.dev.vars` file in the root of the project for local development and add the following secrets for production using the Wrangler CLI:
        ```
        AWS_ACCESS_KEY_ID
        AWS_SECRET_ACCESS_KEY
        AWS_REGION
        ```
    -   To add secrets for production, use the following commands:
        ```bash
        npx wrangler secret put AWS_ACCESS_KEY_ID
        npx wrangler secret put AWS_SECRET_ACCESS_KEY
        npx wrangler secret put AWS_REGION
        ```

### Local Development

-   To run the worker locally, use the following command:
    ```bash
    npx wrangler dev
    ```

### Deployment

-   To deploy the worker to your Cloudflare account, use the following command:
    ```bash
    npx wrangler deploy
    ```
