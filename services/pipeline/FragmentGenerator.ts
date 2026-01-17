import { StoryNode, Character, Scene } from '../../types';
import { StoryBeat } from './types';

const BASE_PATH = "/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-plus";

const getEndpoint = () => {
    if (typeof window !== 'undefined') {
        return `/api/aliyun${BASE_PATH}`;
    }
    return `https://dashscope.aliyuncs.com${BASE_PATH}`;
};

interface FragmentInput {
    storyText: string;
    characters: Character[];
    scenes: Scene[];
    beatsToProcess: StoryBeat[];
    previousContext?: string; // The last line of the previous fragment for continuity
}

export const generateFragment = async (input: FragmentInput): Promise<StoryNode[]> => {
    const apiKey = (typeof process !== 'undefined' ? (process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY) : null)
        || (import.meta as any).env?.VITE_ALIYUN_API_KEY
        || (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("FragmentGenerator: API_KEY missing.");
        throw new Error("API_KEY missing");
    }

    const endpoint = getEndpoint();
    console.log(`[FragmentGenerator] Processing beats ${input.beatsToProcess.map(b => b.id).join(', ')} using endpoint: ${endpoint}`);

    // Construct a focused prompt for this specific batch
    // Construct a focused prompt for this specific batch
    const beatSummaries = input.beatsToProcess.map(b => `- Beat ${b.id}: ${b.summary} (在此处发生)`).join("\n");
    const charContext = (input.characters || []).map(c => `${c.name}: ${c.description}`).join("\n");
    const sceneContext = (input.scenes || []).map(s => `${s.id}: ${s.description}`).join("\n");

    const systemInstruction = `
    你是一个 Galgame 剧本生成引擎的"分镜导演"。
    你的任务是根据提供的小说原文和"剧情节拍表"，**仅为**指定的几个节拍生成详细的对话和旁白节点。

    ### 上下文信息:
    - 登场角色: \n${charContext}
    - **可用场景列表**: \n${sceneContext}
    - **前情提提要**: ${input.previousContext || "无 (这是开篇)"}

    ### 任务目标:
    请**仅生成**涵盖以下剧情节拍的剧本节点:
    ${beatSummaries}

    ### 节点生成规则 (严格遵守):
    1. **格式**: 返回一个纯净的 JSON 数组 \`StoryNode[]\`。
    2. **纯粹对话**: 
       - characterId 对应的 \`text\` 字段只能包含角色说的话。
       - **严禁**包含 "他笑着说"、"怒吼道" 等引导语。
    3. **旁白分离**: 环境描写和动作描写必须放入独立的 \`characterId: null\` 节点。
    4. **线性连接**: 
       - 每个线性节点 nextNodeId 先填 "NEXT" 占位。
       - 最后一个节点的 nextNodeId 填 "END_OF_FRAGMENT"。
    5. **场景一致性**: sceneId 必须严格从"可用场景列表"中选择。

    ### 特殊视觉提取 & 视觉导演指令 (重要):
    如果剧情涉及**关键物品**或**特殊动作/情境**，请添加 \`visualSpecs\` 字段。
    你必须为这些视觉节点担任“视觉场景导演”，将文学描写转化为结构化的 JSON 提示词字符串（压缩为一行）。
    
    \`visualSpecs\` 格式: \`{ type: "item" | "cg", description: "物品或情境描述", visualPrompt: "JSON格式提示词" }\`

    ### 【视觉场景导演提示词 JSON 结构】
    - **style**: 艺术基因锁（例如 "Traditional Chinese ink wash painting", "Studio Ghibli style anime"）
    - **scene**: 地点+天气+时间
    - **shot**: 视角+焦点
    - **lighting**: 光影质感
    - **mood**: 情绪关键词
    - **colors/textures/props/effects**: 视觉细节
    - **negative**: 5-7个排除项

    \`visualPrompt\` 示例: \`{"style":"Classical oil painting, style of Rubens","scene":"dim library, dust motes dancing","shot":"macro close-up on hands","lighting":"warm candlelight, soft chiaroscuro","mood":["reverent","scholarly","mysterious"],"colors":["burnt sienna","deep parchment","gold"],"textures":["cracked leather","yellowed paper"],"props":["quill pen","brass inkwell"],"effects":["glazing","soft focus"],"negative":["modern","digital art","sharp edges"]}\`


    ### 示例输出:
    [
      { "id": "local_1", "characterId": null, "text": "雨还在下。", "sceneId": "s1", "choices": [{ "text": "继续", "nextNodeId": "local_2" }] },
      { "id": "local_2", "characterId": "char_1", "text": "你迟到了。", "sceneId": "s1", "choices": [{ "text": "继续", "nextNodeId": "END_OF_FRAGMENT" }] }
    ]
  `;

    const requestBody = {
        model: MODEL_NAME,
        input: {
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: `小说原文:\n${input.storyText}\n\n请开始生成以上 Beats 对应的剧本节点:` }
            ]
        },
        parameters: {
            result_format: "message",
            temperature: 0.3,
            top_p: 0.8,
            max_tokens: 3000 // Focused generation, high detail
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

        if (!response.ok) throw new Error(`Fragment Gen Failed: ${response.status}`);

        const data = await response.json();
        let content = data.output?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty AI response");

        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        // Parse
        const nodes: StoryNode[] = JSON.parse(content);

        // Safety check: Ensure choices exist (Reusing your previous fix logic notionally)
        return nodes.map((n, idx) => ({
            ...n,
            choices: n.choices && n.choices.length > 0 ? n.choices : [{ text: "继续", nextNodeId: idx === nodes.length - 1 ? "END_OF_FRAGMENT" : "NEXT_PLACEHOLDER" }]
        }));

    } catch (error) {
        console.error("Fragment Generation Error:", error);
        return []; // Return empty on error to allow pipeline to handle or retry
    }
};
