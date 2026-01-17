import { StoryOutline } from './types';

const BASE_PATH = "/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-plus";

const getEndpoint = () => {
  // If we are in a browser and not using a full URL, use the proxy path
  if (typeof window !== 'undefined') {
    return `/api/aliyun${BASE_PATH}`;
  }
  // If we are in Node (testing), use the full URL
  return `https://dashscope.aliyuncs.com${BASE_PATH}`;
};

export const generateOutline = async (storyText: string): Promise<StoryOutline> => {
  const apiKey = (typeof process !== 'undefined' ? (process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY) : null)
    || (import.meta as any).env?.VITE_ALIYUN_API_KEY
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("OutcomeGenerator: API_KEY missing. Checked process.env and import.meta.env");
    throw new Error("API_KEY environment variable is missing.");
  }

  const endpoint = getEndpoint();
  console.log(`[OutcomeGenerator] Using endpoint: ${endpoint}`);

  const systemInstruction = `
    你是一位资深的文学架构师和 Galgame 策划。
    你的任务是**宏观分析**一篇长篇小说，并将其拆解为结构化的“剧本大纲”。

    ### 核心任务:
    1. **提取角色**: 识别文中出现的所有角色(包括有台词的配角)，并生成视觉描述。
       - **注意**: 任何有对话的角色都必须提取，否则会导致剧本中出现未知人物。
    2. **提取场景 (核心)**: 识别文中出现的所有场景 (Location)，并为每个场景担任“视觉场景导演”。
       - **极简主义原则 (极其重要)**: 除非地理位置发生**剧烈**变化，否则禁止创建新场景。
       - **数量限制**: 建议一个章节（2000-4000字）内场景总数控制在 **3-5 个**。
       - **复用逻辑**: 如果只是人物换了、或者时间略微走动，必须复用之前的 sceneId。背景的这种“稳定性”是游戏沉浸感的保证。
    3. **生成节拍表 (Beat Sheet)**: 将剧情拆解为一系列关键事件 (Beats)。
       - 每一个 Beat 代表剧情的一个小阶段（约 200-500 字的剧情跨度）。
       - Beat 不需要包含具体对话，只需要一句话摘要。
       - 确保 Beat 的颗粒度适中一章小说通常可以拆解为 5-10 个 Beats。

    ### 【视觉场景导演指令】
    你必须将文学描写转化为极其专业的 AI 绘图提示词，用于生成**环境背景图**。
    你的 \`visualPrompt\` 字段必须是一个结构化的 JSON 字符串（压缩为一行），包含以下要素：
    - **style**: 艺术基因锁（例如 "Traditional Chinese ink wash painting", "Studio Ghibli style anime", "Hyper-realistic cinematic"）。
    - **scene**: 地点+天气+时间 (侧重环境描写)。
    - **shot**: 镜头视角+焦点 (侧重于广角或全景，展现环境)。
    - **lighting**: 光源+阴影质感。
    - **mood**: 3-5个情绪词。
    - **colors/textures/props/effects**: 匹配 style 的视觉元素。
    - **negative**: 5-7个排除项。
    
    \`visualPrompt\` 示例: \`{"style":"Neon noir concept art, Syd Mead style","scene":"cyberpunk street, rainy night","shot":"low angle, wide shot","lighting":"flickering neon, wet reflections","mood":["oppressive","technological","lonely"],"colors":["electric blue","acid pink","deep amber"],"textures":["chrome","slick asphalt"],"props":["hover-vehicles","steaming vents"],"effects":["motion blur","glitch"],"negative":["sunny","retro-70s","flat lighting"]}\`

    ### JSON 格式要求:
    {
      "title": "剧本标题",
      "synopsis": "全篇故事梗概",
      "characters": [
        { "id": "char_id", "name": "姓名", "description": "性格/身份", "visualTraits": "外貌特征(英文)" }
      ],
      "scenes": [
        { "id": "scene_id", "description": "场景描述", "mood": "氛围", "visualPrompt": "严格遵循上述JSON格式的提示词字符串" }
      ],
      "beats": [
        { 
          "id": 1, 
          "summary": "事件摘要", 
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
      temperature: 0.3,
      top_p: 0.8,
      max_tokens: 2000 // Outline shouldn't be too huge
    }
  };

  try {
    const response = await fetch(endpoint, {
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
