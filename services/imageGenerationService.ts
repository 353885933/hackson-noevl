export interface ImageGenerationResult {
    url: string;
    taskId: string;
    status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
}

const API_KEY = (typeof process !== 'undefined' ? (process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY) : null)
    || (import.meta as any).env?.VITE_ALIYUN_API_KEY
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;

export const generateImage = async (prompt: string | any, type: 'sketch' | 'anime' | 'reality' = 'anime'): Promise<string> => {
    // 0. Parse structured prompt if present
    let finalPrompt = "";

    // Robust parsing logic for both String and Object
    try {
        let p: any = null;

        if (typeof prompt === 'object' && prompt !== null) {
            p = prompt;
            console.log("[imageGenerationService] Prompt is already an object/JSON.");
        } else if (typeof prompt === 'string' && prompt.trim().startsWith('{')) {
            p = JSON.parse(prompt);
        } else if (typeof prompt === 'string') {
            finalPrompt = prompt;
        }

        if (p) {
            const parts = [
                p.style,
                p.scene,
                p.shot,
                p.lighting,
                p.mood && Array.isArray(p.mood) ? p.mood.join(', ') : p.mood,
                p.colors && Array.isArray(p.colors) ? p.colors.join(', ') : p.colors,
                p.textures && Array.isArray(p.textures) ? p.textures.join(', ') : p.textures,
                p.props && Array.isArray(p.props) ? p.props.join(', ') : p.props,
                p.effects && Array.isArray(p.effects) ? p.effects.join(', ') : p.effects
            ].filter(Boolean);

            finalPrompt = parts.join(', ');

            if (p.negative) {
                const negativePrompt = Array.isArray(p.negative) ? p.negative.join(', ') : p.negative;
                console.log(`[imageGenerationService] Extracted negative prompt (Minimax supports negative prompt via style, but we append to prompt for now): ${negativePrompt}`);
            }
        }
    } catch (e) {
        console.log("[imageGenerationService] Using literal prompt string", e);
        if (typeof prompt === 'string') finalPrompt = prompt;
    }

    // Fallback if empty (shouldn't happen)
    if (!finalPrompt) finalPrompt = typeof prompt === 'string' ? prompt : "A beautiful scene";

    // SWITCH: Use Minimax Service by default as requested
    console.log(`[imageGenerationService] Generating image using Minimax for prompt (length ${finalPrompt.length}): ${finalPrompt.substring(0, 50)}...`);

    try {
        const { generateImageMinimax } = await import("./minimaxService");
        return await generateImageMinimax(finalPrompt);
    } catch (error) {
        console.error("Minimax Generation Failed", error);
        throw error;
    }
};
