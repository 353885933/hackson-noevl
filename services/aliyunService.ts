import { GalgameScript } from "../types";
import { generateOutline } from "./pipeline/OutcomeGenerator";
import { generateFragment } from "./pipeline/FragmentGenerator";
import { assembleScript } from "./pipeline/ScriptAssembler";
import { ScriptFragment } from "./pipeline/types";

// Maximum concurrent requests to Aliyun to avoid rate limiting
const CONCURRENCY_LIMIT = 3;

/**
 * Main entry point for the Long Script Processing (LSP) Pipeline.
 * 
 * Architecture:
 * 1. Stage 1 (The Architect): Analyze the full text to generate a global structure (Outline/Beats).
 * 2. Stage 2 (The Director): Process beats in batches to generate detailed script fragments.
 * 3. Stage 3 (The Assembler): Stitch fragments together into a seamless Galgame script.
 */
export const analyzeStory = async (storyText: string): Promise<GalgameScript> => {
  console.log("🚀 Starting Long Script Processing (LSP) Pipeline...");
  const startTime = Date.now();

  try {
    // --- Stage 1: The Architect (Macro Analysis) ---
    console.log("Phase 1/3: Generating Story Outline...");
    const outline = await generateOutline(storyText);
    console.log(`Phase 1 Complete. Generated ${outline.beats.length} beats and ${outline.characters.length} characters.`);

    if (outline.beats.length === 0) {
      throw new Error("Story analysis failed: No beats generated.");
    }

    // --- Stage 2: The Director (Micro Expansion) ---
    console.log("Phase 2/3: Generating Script Fragments...");

    // Batch processing: Process 5 beats at a time to keep context focused
    const BATCH_SIZE = 5;
    const beatChunks = [];
    for (let i = 0; i < outline.beats.length; i += BATCH_SIZE) {
      beatChunks.push(outline.beats.slice(i, i + BATCH_SIZE));
    }

    const fragments: ScriptFragment[] = [];

    // Helper function to process a single batch
    const processBatch = async (batchBeats: typeof outline.beats, batchIndex: number) => {
      console.log(`  - Processing Batch ${batchIndex + 1}/${beatChunks.length} (Beats ${batchBeats[0].id}-${batchBeats[batchBeats.length - 1].id})...`);

      const nodes = await generateFragment({
        storyText: storyText, // In a future specific version, we could slice this text based on "Scene" boundaries if we had them.
        characters: outline.characters,
        scenes: outline.scenes,
        beatsToProcess: batchBeats,
        previousContext: batchIndex > 0 ? "Previous batch context..." : undefined
      });

      console.log(`  ✓ Batch ${batchIndex + 1} finalized: ${nodes.length} nodes.`);

      return {
        beatId: batchIndex, // Using batch index as the reliable sort key
        nodes: nodes
      };
    };

    // Execute with concurrency control
    for (let i = 0; i < beatChunks.length; i += CONCURRENCY_LIMIT) {
      const activeChunks = beatChunks.slice(i, i + CONCURRENCY_LIMIT);
      const batchPromises = activeChunks.map((chunk, idx) => processBatch(chunk, i + idx));
      const batchResults = await Promise.all(batchPromises);

      // Store valid results
      batchResults.forEach(res => {
        if (res.nodes && res.nodes.length > 0) {
          fragments.push(res);
        } else {
          console.warn(`All nodes in Batch ${res.beatId} were empty or failed.`);
        }
      });
    }

    console.log(`Phase 2 Complete. Generated ${fragments.length} valid fragments.`);

    if (fragments.length === 0) {
      throw new Error("Script generation failed: No fragments were successfully generated.");
    }

    // --- Stage 3: The Assembler (Stitching) ---
    console.log("Phase 3/3: Assembling Final Script...");
    const finalScript = assembleScript(outline, fragments);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ LSP Pipeline Complete in ${duration}s. Script Ready.`);

    return finalScript;

  } catch (error) {
    console.error("❌ LSP Pipeline Failed:", error);
    throw error;
  }
};
