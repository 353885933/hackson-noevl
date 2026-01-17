import { StoryOutline } from './types';

const BASE_PATH = "/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-plus"; // Kept for reference but unused in main logic now

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
     1. **提取角色 (重点)**: 识别文中所有角色。
        - **标识 POV**: 指出谁是第一人称主角（视角人物），只有 POV 角色的私人心理活动才会被标记为“心声”。
        - **视觉统一性**: 为每个角色设定一组核心视觉特征（Visual Traits）。
     2. **提取场景 (核心)**: 识别文中出现的所有场景 (Location)，并为每个场景担任“视觉场景导演”。
       - **极简主义原则 (极其重要)**: 除非地理位置发生**剧烈**变化，否则禁止创建新场景。
       - **数量限制**: 建议一个章节（2000-4000字）内场景总数控制在 **3-5 个**。
       - **复用逻辑**: 如果只是人物换了、或者时间略微走动，必须复用之前的 sceneId。背景的这种“稳定性”是游戏沉浸感的保证。
    3. **生成节拍表 (Beat Sheet)**: 将剧情拆解为一系列关键事件 (Beats)。
        - **交互点设计 (Mandatory Branches)**: 每一章必须至少选择 1-2 个 Beat 作为“分支决策点”。
        - **标识方式**: 在 Beat 的摘要中明确标注 \`[分支决策点]\`。
        - 确保 Beat 的颗粒度适中一章小说通常可以拆解为 5-10 个 Beats。

    ### 【视觉场景导演指令】
    你必须将文学描写转化为极其专业的 AI 绘图提示词，用于生成**环境背景图**。
    你的 \`visualPrompt\` 字段必须是一个结构化的 JSON 字符串（压缩为一行），严格遵守以下格式：

    {
      "style": "",      // 🎯核心锚点：艺术家+媒介+渲染风格 (如: "Classical oil painting, style of Rubens, heavy impasto")
      "scene": "",      // 地点+天气+时间
      "shot": "",       // 镜头+视角+焦点 (如: "Wide angle, establishing shot")
      "lighting": "",   // 光源+质感+阴影
      "mood": [],       // 情绪关键词 (3-5个)
      "colors": [],     // 色彩 (3-5个，用词需匹配style传统)
      "textures": [],   // 材质 (3-5个，用词需匹配style媒介)
      "props": [],      // 道具 (4-6个)
      "effects": [],    // 特效 (3-5个，技法/魔法/环境)
      "negative": []    // 排除项 (5-7个，排除style对立风格)
    }

    **【style字段是基因锁】**
    style决定所有其他字段的表达方式。例如：
    - 古典油画 -> 颜料名(ochre), 媒介词(canvas), 技法词(glazing)
    - 赛博朋克 -> 霓虹色(electric blue), 材质(chrome), 环境(smog)
    - 日式动画 -> 手绘感(cel shaded), 柔光(soft bloom), 吉卜力风格
    
    \`visualPrompt\` 示例: \`{"style":"Neon noir concept art, style of Syd Mead","scene":"cyberpunk street, rainy night","shot":"low angle, wide shot","lighting":"flickering neon, wet reflections","mood":["oppressive","technological","lonely"],"colors":["electric blue","acid pink","deep amber"],"textures":["chrome","slick asphalt"],"props":["hover-vehicles","steaming vents"],"effects":["motion blur","glitch"],"negative":["sunny","retro-70s","flat lighting"]}\`

    ### JSON 格式要求:
    {
      "title": "剧本标题",
      "synopsis": "全篇故事梗概",
      "characters": [
        { "id": "char_id", "name": "姓名", "description": "性格/身份", "isPOV": true, "visualTraits": "外貌特征(英文)" }
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

  // SWITCH: Use ModelScope (GLM-4.7) as requested
  console.log(`[OutcomeGenerator] Calling ModelScope GLM-4.7...`);

  try {
    const { chatCompletion } = await import("../dashscopeService");

    const content = await chatCompletion({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `请分析以下小说内容并生成大纲:\n\n${storyText}` }
      ],
      temperature: 0.3,
      maxTokens: 4096
    });

    console.log("[OutcomeGenerator] Raw content received from ModelScope:", content.substring(0, 100) + "...");

    // Clean up code blocks if present
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const rawOutline = JSON.parse(cleanContent);

    // Defensive normalization to ensure arrays exist
    const outline: StoryOutline = {
      title: rawOutline.title || "未命名大纲",
      synopsis: rawOutline.synopsis || "",
      // Ensure these are always arrays to prevent map() crashes in FragmentGenerator
      beats: Array.isArray(rawOutline.beats) ? rawOutline.beats : [],
      characters: Array.isArray(rawOutline.characters)
        ? rawOutline.characters.map((c: any) => ({
          ...c,
          // Robust boolean conversion for AI fluctuations
          isPOV: c.isPOV === true || String(c.isPOV).toLowerCase() === 'true' || c.isPOV === '是'
        }))
        : [],
      scenes: Array.isArray(rawOutline.scenes) ? rawOutline.scenes : []
    };

    console.log("Stage 1 Complete: Outline Generated", outline);
    return outline;

  } catch (error) {
    console.error("Stage 1 Failed:", error);
    throw error;
  }
};
