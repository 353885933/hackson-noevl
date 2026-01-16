import { StoryOutline } from './types';

const ALIYUN_API_ENDPOINT = "/api/aliyun/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-plus";

export const generateOutline = async (storyText: string): Promise<StoryOutline> => {
  const apiKey = process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY; // Fallback for stability
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }

  const systemInstruction = `
    你是一位资深的文学架构师和 Galgame 策划。
    你的任务是**宏观分析**一篇长篇小说，并将其拆解为结构化的“剧本大纲”。

    ### 核心任务:
    1. **提取角色**: 识别文中出现的所有主要角色，并生成视觉描述 (visualTraits)。
    2. **提取场景**: 识别文中出现的所有场景 (Location)，并生成视觉提示词 (visualPrompt)。
    3. **生成节拍表 (Beat Sheet)**: 将剧情拆解为一系列关键事件 (Beats)。
       - 每一个 Beat 代表剧情的一个小阶段（约 200-500 字的剧情跨度）。
       - Beat 不需要包含具体对话，只需要一句话摘要。
       - 确保 Beat 的颗粒度适中一章小说通常可以拆解为 5-10 个 Beats。

    ### JSON 格式要求:
    {
      "title": "剧本标题",
      "synopsis": "全篇故事梗概",
      "characters": [
        { "id": "char_id", "name": "姓名", "description": "性格/身份", "visualTraits": "外貌特征(英文)" }
      ],
      "scenes": [
        { "id": "scene_id", "description": "场景描述", "mood": "氛围", "visualPrompt": "场景绘画提示词(英文)" }
      ],
      "beats": [
        { 
          "id": 1, 
          "summary": "事件摘要 (例如: 周明瑞从梦中惊醒，感到头痛欲裂)", 
          "locationId": "scene_id", 
          "requiredCharacters": ["char_id"] 
        }
      ]
    }
    
    请确保 JSON 格式标准，严禁包含Markdown代码块符号。
  `;

  const requestBody = {
    model: MODEL_NAME,
    input: {
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `请分析以下小说内容并生成大纲:\n\n${storyText}` }
      ]
    },
    parameters: {
      result_format: "message",
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 2000 // Outline shouldn't be too huge
    }
  };

  try {
    const response = await fetch(ALIYUN_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Aliyun API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.output?.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content in Aliyun response");

    // Clean up code blocks if present
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const rawOutline = JSON.parse(content);

    // Defensive normalization to ensure arrays exist
    const outline: StoryOutline = {
      title: rawOutline.title || "未命名大纲",
      synopsis: rawOutline.synopsis || "",
      // Ensure these are always arrays to prevent map() crashes in FragmentGenerator
      beats: Array.isArray(rawOutline.beats) ? rawOutline.beats : [],
      characters: Array.isArray(rawOutline.characters) ? rawOutline.characters : [],
      scenes: Array.isArray(rawOutline.scenes) ? rawOutline.scenes : []
    };

    console.log("Stage 1 Complete: Outline Generated", outline);
    return outline;

  } catch (error) {
    console.error("Stage 1 Failed:", error);
    throw error;
  }
};
