import { GalgameScript, AnalysisProgress } from "../types";
import { generateOutline } from "./pipeline/OutcomeGenerator";
import { generateFragment } from "./pipeline/FragmentGenerator";
import { assembleScript } from "./pipeline/ScriptAssembler";
import { ScriptFragment } from "./pipeline/types";

// Reduced concurrency to 1 to prevent Rate Limiting (429) on large context
const CONCURRENCY_LIMIT = 1;

/**
 * Utility: Retry operation with exponential backoff
 */
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  throw lastError;
}

/**
 * Main entry point for the Long Script Processing (LSP) Pipeline.
 */
export const analyzeStory = async (
  storyText: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<GalgameScript> => {
  console.log("🚀 Starting Long Script Processing (LSP) Pipeline...");
  const startTime = Date.now();

  try {
    // --- Stage 1: The Architect (Macro Analysis) ---
    console.log("Phase 1/4: Generating Story Outline...");
    onProgress?.({ phase: 'OUTLINE', current: 0, total: 100, message: "正在构思剧情大纲..." });

    const outline = await withRetry(() => generateOutline(storyText));
    onProgress?.({ phase: 'OUTLINE', current: 100, total: 100, message: "大纲构思完成。" });

    if (outline.beats.length === 0) {
      throw new Error("Story analysis failed: No beats generated.");
    }

    // --- Stage 2: The Director (Micro Expansion) ---
    console.log("Phase 2/4: Generating Script Fragments...");
    const BATCH_SIZE = 5;
    const beatChunks = [];
    for (let i = 0; i < outline.beats.length; i += BATCH_SIZE) {
      beatChunks.push(outline.beats.slice(i, i + BATCH_SIZE));
    }

    const fragments: ScriptFragment[] = [];

    const processBatch = async (batchBeats: typeof outline.beats, batchIndex: number) => {
      onProgress?.({
        phase: 'CHUNKS',
        current: batchIndex,
        total: beatChunks.length,
        message: `正在编写剧本细节 (${batchIndex + 1}/${beatChunks.length})...`
      });

      const nodes = await withRetry(() => generateFragment({
        storyText: storyText,
        characters: outline.characters,
        scenes: outline.scenes,
        beatsToProcess: batchBeats,
        previousContext: batchIndex > 0 ? "Previous batch context..." : undefined
      }));

      return { beatId: batchIndex, nodes: nodes };
    };

    for (let i = 0; i < beatChunks.length; i++) {
      const result = await processBatch(beatChunks[i], i);
      if (result.nodes && result.nodes.length > 0) {
        fragments.push(result);
      }
    }

    // --- Stage 3: The Assembler (Stitching) ---
    console.log("Phase 3/4: Assembling Final Script...");
    const finalScript = assembleScript(outline, fragments);

    // --- Phase 4: Visual Asset Generation (Pre-generation Mode) ---
    console.log("Phase 4/4: Generating Background Assets (Wanx)...");

    const sceneAssets = finalScript.scenes.filter(s => !s.imageUrl);
    const totalAssets = sceneAssets.length;
    let assetsDone = 0;

    if (totalAssets > 0) {
      const { generateImage } = await import("./imageGenerationService");

      // 1. Generate Scene Backgrounds
      for (const scene of sceneAssets) {
        onProgress?.({
          phase: 'ASSETS',
          current: assetsDone,
          total: totalAssets,
          message: `正在精心绘制环境背景: ${scene.description.slice(0, 15)}...`
        });

        try {
          scene.imageUrl = await withRetry(() =>
            generateImage(scene.visualPrompt, 'reality')
          );
        } catch (err) {
          console.error(`❌ Failed to generate scene background [${scene.id}]:`, err);
        }
        assetsDone++;
      }
    }

    // --- Phase 5: Browser Preloading (Zero-Loading Mode) ---
    if (typeof window !== 'undefined') {
      const allAssetMappings: { ref: any, key: string, url: string }[] = [];

      // Collect only scenes for preloading
      finalScript.scenes.forEach(s => {
        if (s.imageUrl) allAssetMappings.push({ ref: s, key: 'imageUrl', url: s.imageUrl });
      });

      if (allAssetMappings.length > 0) {
        console.log(`Phase 5/4: Blobtifying ${allAssetMappings.length} assets for zero-loading...`);
        onProgress?.({
          phase: 'PRELOADING',
          current: 0,
          total: allAssetMappings.length,
          message: "正在进行最后的高速缓存同步，确保瞬间响应..."
        });

        let loadedCount = 0;
        await Promise.all(allAssetMappings.map(async (mapping) => {
          try {
            // Priority 1: Fetch as Blob (for object URL / instant display)
            const response = await fetch(mapping.url).catch(() => null);
            if (response && response.ok) {
              const blobData = await response.blob();
              const localUrl = URL.createObjectURL(blobData);
              mapping.ref[mapping.key] = localUrl;
            } else {
              // Priority 2: Standard Image preloading (populates browser cache)
              await new Promise((res) => {
                const img = new Image();
                img.onload = () => res(null);
                img.onerror = () => res(null);
                img.src = mapping.url;
              });
            }
          } catch (err) {
            console.warn(`Failed to preload asset: ${mapping.url}`, err);
          } finally {
            loadedCount++;
            onProgress?.({
              phase: 'PRELOADING',
              current: loadedCount,
              total: allAssetMappings.length,
              message: `资源已就绪 (${loadedCount}/${allAssetMappings.length})...`
            });
          }
        }));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ LSP Pipeline Complete in ${duration}s. Script Ready.`);

    return finalScript;

  } catch (error) {
    console.error("❌ LSP Pipeline Failed:", error);
    throw error;
  }
};
