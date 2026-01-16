import { GalgameScript } from "../types";

const ALIYUN_API_ENDPOINT = "/api/aliyun/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-max";

export const analyzeStory = async (storyText: string): Promise<GalgameScript> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }

  const systemInstruction = `
    你是一位顶级的视觉小说(Galgame)导演和游戏设计师。
    你的任务是将提供的【线性小说】重构为一个【可交互的 Galgame 剧本】。

    ### 核心指令(请严格遵守):

    1. **控制选项频率(节奏感)**:
       - **不要**让每个节点都有分支选项。
       - 大部分时候,剧情应该是线性推进的。**请将剧情切分为一系列连续的节点**。
       - 对于线性推进的节点,请只提供**一个**选项,内容为"继续"、"..."或简单的动作描述。
       - **只有**在剧情关键转折点、需要玩家表达立场、或决定剧情走向时,才提供 2-3 个分支选项。
       - 理想比例:每 3-5 个线性对话节点,出现一次互动分支。

    2. **逻辑连续性(Context Memory)**:
       - 这是一个图结构剧本。请确保分支后的剧情逻辑严密。
       - 既然是基于线性小说改编,请确保无论玩家选择哪条路,核心信息都能以某种方式被玩家获知,或者剧情能合理地收束回主线(菱形叙事结构),除非导致了 Bad End。
       - 不要让角色在 B 分支中谈论只有 A 分支发生过的事情。

    3. **角色与演出**:
       - 旁白(narrator)应尽量减少,多通过角色对话来表达信息。
       - 提取角色的独特语气。

    4. **语言要求**:
       - 剧本内容必须是**简体中文**。
       - VisualPrompt 必须是英文。

    ### 结构输出要求:
    - **Scene**:当地点发生实质变化时才切换 Scene。
    - **VisualPrompt**:用于生成背景图的英文提示词,需包含光照、风格(Noir/Cyberpunk/Industrial)描述。

    ### 输出格式:
    请返回严格的 JSON 格式,符合以下结构:
    {
      "title": "string",
      "synopsis": "string",
      "characters": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "visualTraits": "string"
        }
      ],
      "scenes": [
        {
          "id": "string",
          "description": "string",
          "mood": "string",
          "visualPrompt": "string (optional)"
        }
      ],
      "startNodeId": "string",
      "nodes": [
        {
          "id": "string",
          "sceneId": "string",
          "characterId": "string or null",
          "text": "string",
          "isEnding": "boolean (optional)",
          "choices": [
            {
              "text": "string",
              "nextNodeId": "string",
              "moodEffect": "string (optional)"
            }
          ]
        }
      ]
    }
    
    所有非结局节点(isEnding: false)必须至少包含一个 choice。
    如果是线性剧情,choice 数组中只放一个指向下一节点的选项即可。
    
    **重要**: 你的回复必须是纯 JSON,不要包含任何其他文本、解释或markdown标记。
  `;

  const requestBody = {
    model: MODEL_NAME,
    input: {
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: `请将这部小说文本转化为剧本,重点是保持阅读的流畅性,不要过于频繁地打断玩家,只在关键时刻给出选项。\n\n小说内容:\n${storyText}`
        }
      ]
    },
    parameters: {
      result_format: "message",
      temperature: 0.7,
      top_p: 0.9,
    }
  };

  try {
    const response = await fetch(ALIYUN_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Aliyun API Error:", errorData);
      throw new Error(`Aliyun API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Aliyun response structure: data.output.choices[0].message.content
    const content = data?.output?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Unexpected response structure:", data);
      throw new Error("No content in Aliyun API response.");
    }

    // Parse the JSON response
    try {
      // Remove potential markdown code blocks if present
      let jsonText = content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const scriptData = JSON.parse(jsonText) as GalgameScript;
      return scriptData;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse Aliyun API response as JSON.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while calling Aliyun API.");
  }
};
