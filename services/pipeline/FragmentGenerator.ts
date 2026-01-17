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
    const beatSummaries = input.beatsToProcess.map(b => `- Beat ${b.id}: ${b.summary} (在此处发生)`).join("\n");
    const sortedChars = [...(input.characters || [])].sort((a, b) => (b.isPOV ? 1 : 0) - (a.isPOV ? 1 : 0));
    const charContext = sortedChars.map(c => `${c.name}${c.isPOV ? ' (视角人物/POV)' : ''}: ${c.description}`).join("\n");
    const sceneContext = (input.scenes || []).map(s => `${s.id}: ${s.description}`).join("\n");

    const systemInstruction = `
    你是一个 Galgame 剧本生成引擎的"分镜导演"。
    你的任务是根据提供的小说原文和"剧情节拍表"，**仅为**指定的几个节拍生成详细的对话和旁白节点。

    ### 🕵️ 角色归属判定协议 (必须严格执行):
    在生成台词节点前，必须进行以下三步判定：
    1. **上下文锚点**: 检查原文台词前后的动作描写（如“xx说道”、“xx叹气”）。
    2. **称呼逻辑**: 对照【角色信息】中的别名（如“哥哥”=妹妹说话）。
    3. **引用校验**: 在生成的 JSON 中，每个节点**必须**包含 \`_source_text\` 字段，填入该节点对应的小说原文作为依据，防止幻觉。

    ### 上下文信息:
    - 登场角色: \n${charContext}
    - **可用场景列表**: \n${sceneContext}
    - **前情提要**: ${input.previousContext || "无 (这是开篇)"}

    ### 任务目标:
    请**仅生成**涵盖以下剧情节拍的剧本节点:
    ${beatSummaries}

    ### 节点生成规则 (严格遵守):
    1. **格式**: 返回纯净 JSON 数组 \`StoryNode[]\`。

    ### 叙事身份终极指令 (违者逻辑崩溃):
    - **【旁白模式】**: 当文中是环境描写、动作描写或第三人称叙述时，**必须**设 \`characterId: null\`。
    - **【台词模式】**: 当文中是角色公开说出的话时，**必须**设为对应角色ID，\`text\` **严禁**包裹任何括号。
    - **【心声模式】**: 当文中是标注为 (POV) 视角角色的内心OS时，**必须**设为该角色ID，\`text\` **必须**使用中文圆括号 \`（ ）\` 包裹。
    - **【拒绝混合】**: 严禁在同一个节点内混合台词和动作。如“他点点头说：‘好的’”必须拆分为：1.旁白节点(他点点头) -> 2.台词节点(好的)。

    3. **交互选择 (关键命题)**:
    - **线性模式**: 默认使用一个选项，\`text: "继续"\`，\`nextNodeId: "NEXT"\`。
    - **分支模式 (必须执行)**: 如果剧情节拍标记了 \`[分支决策点]\`，或者在该 Beat 结尾处，**必须**设计 2-3 个交互选项。
    - **分支质量**: 选项应体现主角的性格分歧（如：勇敢 vs 隐忍，积极 vs 消极），或者是抉择（比如向左走还是向右走、帮助还是拒绝帮助、救人还是杀人等）。
    - **逻辑闭环**: 分支后的节点必须在该 JSON 片段中定义清楚，并最终汇聚。

    5. **场景一致性**: sceneId 必须严格从"可用场景列表"中选择。剧本的大部分时间应保持背景稳定。

    6. **视觉高光节点 (Aha Moments)**:
    - 如果剧情达到**情感高峰、关键反转或极具视觉冲击力**的时刻（比如“红月”），请添加 \`visualSpecs\` 字段。
    - 这通常被称为 "Event CG"，会替换当前背景展示一张精美的一次性大图。
    - **频率控制**: 极为克制，每个片段通常只允许出现 0-1 个视觉高亮节点。
    - \`visualSpecs\` 格式: \`{ type: "cg", description: "该高光时刻的场景描述", visualPrompt: "JSON格式提示词" }\`

    ### 【视觉场景导演指令 (仅对 CG 节点)】
    你必须将该高光时刻转化为极其专业的 AI 绘图提示词。
    \`visualPrompt\` 必须是严格的 JSON 结构：
    {
    "style": "", // 🎯核心锚点：艺术家+媒介+渲染风格 (如: "Cinematic anime style, Makoto Shinkai style, vibrant colors")
    "scene": "", // 地点+天气+时间
    "shot": "", // 镜头+视角+焦点 (如: "Dramatic low angleish close-up")
    "lighting": "", // 光源+质感+阴影
    "mood": [], // 情绪关键词 (3-5个)
    "colors": [], // 色彩 (3-5个)
    "textures": [], // 材质 (3-5个)
    "props": [], // 道具 (4-6个)
    "effects": [], // 特效 (3-5个)
    "negative": [] // 排除项 (5-7个)
    }

    **【style字段是基因锁】**
    style决定所有其他字段的表达方式。
    - 确保所有描述词 (colors, textures 等) 与 style 保持一致。

    **【视觉补全指令 (Visual Hallucination)】**:
    如果小说原文对场景环境描写缺失 (如仅有对话)，你**必须**利用你的想象力，根据上下文**自动补全**合理的视觉细节。
    - 自动补充：天气 (雨/雪/雾)、时间 (黄昏/深夜)、光影 (霓虹灯/烛光)、背景物件 (全息广告牌/古董花瓶)。
    - **禁止**生成空洞的描述 (如 "一个房间")，必须具体 (如 "昏暗的审讯室，摇曳的顶灯，斑驳的铁墙")。

    ### [CRITICAL FORMATTING MANDATE - ZERO TOLERANCE]
    1. **NO MIXING**: Do NOT put actions (e.g., "He sighed") into a node with a \`characterId\`. Those belong to \`characterId: null\`.
    2. **PARENTHESES**: Only Use \`（ \` and \` ）\` for the **POV Character's** inner monologues.
    3. **QUOTES**: Do NOT include quotes like 「 」 or " " in the JSON text. The engine handles that.
    4. **ID ACCURACY**: If the text is a character's speech, the \`characterId\` MUST be present and accurate.

    ### 示例输出 (必须包含 _source_text 和 visualSpecs):
    [
      { 
        "id": "f_1", 
        "characterId": null, 
        "text": "窗外雷声大作，雨水顺着屋檐滴落。", 
        "_source_text": "窗外雷声大作，雨水像断了线的珠子顺着屋檐落下。", 
        "sceneId": "s1", 
        "choices": [{ "text": "继续", "nextNodeId": "f_2" }] 
      },
      { 
        "id": "f_2", 
        "characterId": null, 
        "text": "一个红衣身影忽然出现在雨幕中。", 
        "_source_text": "雨幕中忽然多了一个红色的身影。", 
        "sceneId": "s1", 
        "visualSpecs": {
           "type": "cg",
           "description": "神秘红衣女子雨中登场",
           "visualPrompt": "{\"style\": \"Anime style\", \"scene\": \"Rainy night\", \"shot\": \"Full body\", \"lighting\": \"Cinematic backlight\", \"mood\": [\"mysterious\"], \"colors\": [\"Red\", \"Black\"], \"textures\": [\"Wet fabric\"], \"props\": [\"Red umbrella\"], \"effects\": [\"Rain droplets\"], \"negative\": [\"bad anatomy\"]}"
        },
        "choices": [{ "text": "继续", "nextNodeId": "f_3" }] 
      },
      { 
        "id": "f_3", 
        "characterId": "char_hero", 
        "text": "（那是... 小雅？）", 
        "_source_text": "顾言心中一惊：那是小雅吗？", 
        "sceneId": "s1", 
        "choices": [
          { "text": "冲入雨中确认", "nextNodeId": "f_4_a" },
          { "text": "警惕地观察", "nextNodeId": "f_4_b" }
        ] 
      },
      { 
        "id": "f_4_a", 
        "characterId": "char_hero", 
        "text": "「小雅！是你吗！」", 
        "_source_text": "“小雅！”他大喊一声，“是你吗！”", 
        "sceneId": "s1", 
        "choices": [{ "text": "继续", "nextNodeId": "END_OF_FRAGMENT" }] 
      }
    ]
    `;

    // SWITCH: Use ModelScope (GLM-4.7) as requested
    console.log(`[FragmentGenerator] Calling ModelScope GLM-4.7...`);

    try {
        const { chatCompletion } = await import("../dashscopeService");

        const content = await chatCompletion({
            messages: [
                { role: "system", content: systemInstruction },
                {
                    role: "user",
                    content: `针对以下角色信息和小说原文，请生成对应的剧本节点。
重要提示：视角人物(POV)是: ${input.characters.find(c => c.isPOV)?.name || "无"}。

小说原文:
${input.storyText}

请开始生成:`
                }
            ],
            temperature: 0.3,
            maxTokens: 3500 // Increased token limit for detailed output
        });

        if (!content) throw new Error("Empty AI response");

        const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();

        // Parse
        let nodes: StoryNode[] = [];
        try {
            nodes = JSON.parse(cleanContent);
        } catch (e) {
            console.error("JSON Parse Error. Raw content:", cleanContent);
            throw new Error("Failed to parse AI response as JSON");
        }

        // Safety check: Ensure choices exist
        return nodes.map((n, idx) => ({
            ...n,
            choices: n.choices && n.choices.length > 0 ? n.choices : [{ text: "继续", nextNodeId: idx === nodes.length - 1 ? "END_OF_FRAGMENT" : "NEXT_PLACEHOLDER" }]
        }));

    } catch (error) {
        console.error("Fragment Generation Error:", error);
        return [];
    }
};
