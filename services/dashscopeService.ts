/**
 * Aliyun DashScope API Service
 * Compatible wrapper for chat completion using Qwen models
 */

import OpenAI from "openai";

const DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_MODEL = "qwen-plus"; // or "qwen-turbo" for faster responses

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface ChatCompletionOptions {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
}

/**
 * Create Aliyun DashScope OpenAI-compatible client
 */
const createDashScopeClient = (): OpenAI => {
    const apiKey = (typeof process !== 'undefined' ? (process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY) : null)
        || (import.meta as any).env?.VITE_DASHSCOPE_API_KEY
        || (import.meta as any).env?.VITE_ALIYUN_API_KEY
        || (import.meta as any).env?.DASHSCOPE_API_KEY;

    if (!apiKey) {
        throw new Error("DASHSCOPE_API_KEY environment variable is missing.");
    }

    // Use proxy in browser environment to avoid CORS
    const baseURL = typeof window !== 'undefined'
        ? `${window.location.origin}/api/aliyun/compatible-mode/v1`
        : DASHSCOPE_BASE_URL;

    return new OpenAI({
        baseURL: baseURL,
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
};

/**
 * Chat completion with retry logic for rate limiting
 */
export const chatCompletion = async (
    options: ChatCompletionOptions
): Promise<string> => {
    const client = createDashScopeClient();
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await client.chat.completions.create({
                model: DASHSCOPE_MODEL,
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 2048,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error("No response from Aliyun DashScope.");
            }

            return content;
        } catch (error: any) {
            lastError = error;

            // Check if it's a rate limit error (429)
            if (error?.status === 429 || error?.message?.includes('429')) {
                if (attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.log(`[Aliyun] Rate limit hit, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            }

            throw error;
        }
    }

    throw lastError || new Error("Failed after retries");
};

export default {
    chatCompletion,
};
