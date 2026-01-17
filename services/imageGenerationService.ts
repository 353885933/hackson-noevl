export interface ImageGenerationResult {
    url: string;
    taskId: string;
    status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
}

const BASE_PATH = "/api/v1/services/aigc/text2image/image-synthesis";
const TASK_PATH = "/api/v1/tasks";

const getEndpoint = (path: string) => {
    if (typeof window !== 'undefined') {
        return `/api/aliyun${path}`;
    }
    return `https://dashscope.aliyuncs.com${path}`;
};

const API_KEY = (typeof process !== 'undefined' ? (process.env.VITE_ALIYUN_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY) : null)
    || (import.meta as any).env?.VITE_ALIYUN_API_KEY
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;

export const generateImage = async (prompt: string, type: 'sketch' | 'anime' | 'reality' = 'anime'): Promise<string> => {
    if (!API_KEY) {
        console.warn("[imageGenerationService] API_KEY missing. Skipping image generation.");
        return ""; // Return empty string to indicate no image generated, defaulting to placeholder.
    }

    // 0. Parse structured prompt if present
    let finalPrompt = prompt;
    try {
        // Check if it's our new structured JSON format
        if (prompt.trim().startsWith('{') && prompt.trim().endsWith('}')) {
            const p = JSON.parse(prompt);
            // Reconstruct a powerful natural language prompt from the director's cut
            const parts = [
                p.style,
                p.scene,
                p.shot,
                p.lighting,
                p.mood?.join(', '),
                p.colors?.join(', '),
                p.textures?.join(', '),
                p.props?.join(', '),
                p.effects?.join(', ')
            ].filter(Boolean);

            finalPrompt = parts.join(', ');

            if (p.negative && Array.isArray(p.negative)) {
                // We should ideally pass negative prompts if the API supports it
                // For Wanx v1, we append it with a standard prefix if needed, 
                // but let's stick to positive reinforcement for now or append "avoid: ..."
                console.log(`[imageGenerationService] Extracted negative prompt elements: ${p.negative.join(', ')}`);
            }
        }
    } catch (e) {
        // Not JSON or parse error, use original prompt
        console.log("[imageGenerationService] Using literal prompt string (not structured JSON)");
    }

    const endpoint = getEndpoint(BASE_PATH);
    console.log(`[imageGenerationService] Generating image using final prompt: ${finalPrompt}`);

    // 1. Submit Generation Task
    const submitResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'X-DashScope-Async': 'enable' // Force async for image gen
        },
        body: JSON.stringify({
            model: "wanx-v1",
            input: {
                prompt: finalPrompt
            },
            parameters: {
                style: type === 'anime' ? "<auto>" : "<auto>",
                size: "1280*720",
                n: 1
            }
        })
    });

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Image Gen Submit Failed: ${submitResponse.status} - ${errorText}`);
    }

    const submitData = await submitResponse.json();
    const taskId = submitData.output.task_id;
    console.log(`Image Generation Task Submitted: ${taskId}`);

    // 2. Poll for Completion
    return pollForImage(taskId);
};

const pollForImage = async (taskId: string, attempts = 0): Promise<string> => {
    const MAX_ATTEMPTS = 60; // 2 minutes max (2s interval)
    if (attempts >= MAX_ATTEMPTS) throw new Error("Image Generation Timed Out");

    await new Promise(r => setTimeout(r, 2000)); // Wait 2s

    const endpoint = getEndpoint(`${TASK_PATH}/${taskId}`);

    const checkResponse = await fetch(endpoint, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    });

    if (!checkResponse.ok) {
        throw new Error(`Task Check Failed: ${checkResponse.status}`);
    }

    const checkData = await checkResponse.json();
    const status = checkData.output.task_status;

    console.log(`Task ${taskId} status: ${status}`);

    if (status === 'SUCCEEDED') {
        const url = checkData.output.results[0].url;
        return url;
    } else if (status === 'FAILED') {
        throw new Error(`Image Generation Failed: ${checkData.output.message}`);
    } else {
        return pollForImage(taskId, attempts + 1);
    }
};
