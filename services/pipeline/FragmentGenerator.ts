import { StoryNode, Character, Scene } from '../../types';
import { StoryBeat } from './types';

const ALIYUN_API_ENDPOINT = "/api/aliyun/api/v1/services/aigc/text-generation/generation";
const MODEL_NAME = "qwen-plus";

interface FragmentInput {
    storyText: string;
    characters: Character[];
    scenes: Scene[];
    beatsToProcess: StoryBeat[];
    previousContext?: string; // The last line of the previous fragment for continuity
}

export const generateFragment = async (input: FragmentInput): Promise<StoryNode[]> => {
    const apiKey = process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");

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
    - **前情提要**: ${input.previousContext || "无 (这是开篇)"}

    ### 任务目标:
    请**仅生成**涵盖以下剧情节拍的剧本节点:
    ${beatSummaries}

    ### 节点生成规则 (严格遵守):
    1. **格式**: 返回一个纯净的 JSON 数组 \`StoryNode[]\`。
    2. **纯粹对话**: 
       - characterId 对应的 \`text\` 字段只能包含角色说的话。
       - **严禁**包含 "他笑着说"、"怒吼道" 等引导语。
       - **严禁**截断对话首字。
    3. **旁白分离**: 环境描写和动作描写必须放入独立的 \`characterId: null\` 节点。
    4. **线性连接**: 
       - 除非是分支选项，否则每个节点都必须包含 **1个 "继续" 选项** (nextNodeId 先填 "NEXT" 占位, 后期组装时会自动替换)。
       - 最后一个节点的选项 nextNodeId 填 "END_OF_FRAGMENT"。
    5. **场景一致性**:
       - sceneId 必须严格从"可用场景列表"中选择。严禁捏造 ID。


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
            temperature: 0.7,
            top_p: 0.8,
            max_tokens: 3000 // Focused generation, high detail
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
