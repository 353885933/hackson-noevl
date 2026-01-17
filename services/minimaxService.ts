
/**
 * MiniMax (Hailuo) Image Generation Service
 * 
 * Base URL: https://api.minimaxi.com/v1/image_generation
 * Model: image-01
 */

const MINIMAX_BASE_URL = typeof window !== 'undefined'
    ? `${window.location.origin}/api/minimax/v1/image_generation`
    : "https://api.minimaxi.com/v1/image_generation";

const MINIMAX_API_KEY = (typeof process !== 'undefined' ? (process.env.minimax_api_key || process.env.MINIMAX_API_KEY) : null)
    || (import.meta as any).env?.VITE_MINIMAX_API_KEY;

export interface ValidationResponse {
    result: boolean;
}

export const generateImageMinimax = async (prompt: string): Promise<string> => {
    if (!MINIMAX_API_KEY) {
        console.warn("[minimaxService] API_KEY missing.");
        throw new Error("MINIMAX_API_KEY is missing.");
    }

    console.log(`[minimaxService] Generating image with prompt: ${prompt.substring(0, 50)}...`);

    const response = await fetch(MINIMAX_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MINIMAX_API_KEY}`
        },
        body: JSON.stringify({
            prompt: prompt,
            model: "image-01",
            n: 1
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Minimax Image Gen Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[minimaxService] Response received:", JSON.stringify(data).substring(0, 100));

    // Support both old and new response formats if possible, or just the verified one.
    // Confirmed format: { id: "...", data: { image_urls: ["..."] } } (Wait, verified by user output in test script)
    // Actually, user output showed: {"id":"...","data":{...}} (Truncated?)
    // But typically: data.files[0].url or data.data.image_urls[0] ?

    // User shared: {"id":"...","data":{"image_urls":["https://..."]}}

    if (data.data && data.data.image_urls && data.data.image_urls.length > 0) {
        return data.data.image_urls[0];
    }

    // Fallback/Legacy checks
    if (data.files && data.files.length > 0) {
        return data.files[0].url;
    }

    if (data.base_resp && data.base_resp.status_code !== 0) {
        throw new Error(`Minimax Error: ${data.base_resp.status_msg}`);
    }

    throw new Error("No image URL found in Minimax response: " + JSON.stringify(data));
};
