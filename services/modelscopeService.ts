/**
 * ModelScope GLM-4.7 API Service
 * 使用 OpenAI 兼容接口调用智谱 GLM-4.7 模型
 *
 * Base URL: https://api-inference.modelscope.cn/v1
 * Model: ZhipuAI/GLM-4.7
 */

import OpenAI from "openai";

// ModelScope API 配置
const MODELSCOPE_BASE_URL = "https://api-inference.modelscope.cn/v1";
const MODELSCOPE_MODEL = "ZhipuAI/GLM-4.7";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * 创建 ModelScope OpenAI 兼容客户端
 */
const createModelscopeClient = (): OpenAI => {
  const apiKey = process.env.MODELSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("MODELSCOPE_API_KEY environment variable is missing.");
  }

  return new OpenAI({
    baseURL: MODELSCOPE_BASE_URL,
    apiKey: apiKey,
  });
};

/**
 * 非流式调用 GLM-4.7
 */
export const chatCompletion = async (
  options: ChatCompletionOptions
): Promise<string> => {
  const client = createModelscopeClient();

  const response = await client.chat.completions.create({
    model: MODELSCOPE_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from ModelScope GLM-4.7.");
  }

  return content;
};

/**
 * 流式调用 GLM-4.7
 */
export const chatCompletionStream = async function* (
  options: ChatCompletionOptions
): AsyncGenerator<string, void, unknown> {
  const client = createModelscopeClient();

  const stream = await client.chat.completions.create({
    model: MODELSCOPE_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
};

/**
 * 简单对话接口 - 快速调用
 */
export const askGLM = async (
  userMessage: string,
  systemPrompt: string = "You are a helpful assistant."
): Promise<string> => {
  return chatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
};

/**
 * 故事分析 - 适配 Galgame 项目
 */
export const analyzeStoryWithGLM = async (storyText: string): Promise<string> => {
  const systemPrompt = `
    你是一位顶级的视觉小说（Galgame）导演和游戏设计师。
    你的任务是将提供的线性小说重构为一个可交互的 Galgame 剧本。
    请返回 JSON 格式的剧本数据。
  `;

  return chatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `请将这部小说文本转化为剧本：\n\n${storyText}` },
    ],
    temperature: 0.7,
    maxTokens: 4096,
  });
};

export default {
  chatCompletion,
  chatCompletionStream,
  askGLM,
  analyzeStoryWithGLM,
};
