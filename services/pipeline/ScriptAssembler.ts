import { GalgameScript, StoryNode } from '../../types';
import { StoryOutline, ScriptFragment } from './types';

export const assembleScript = (outline: StoryOutline, fragments: ScriptFragment[]): GalgameScript => {
    let allNodes: StoryNode[] = [];

    // Sort fragments by beatId to ensure correct order
    const sortedFragments = [...fragments].sort((a, b) => a.beatId - b.beatId);

    sortedFragments.forEach((fragment, fragmentIndex) => {
        const isLastFragment = fragmentIndex === sortedFragments.length - 1;
        const nextFragment = sortedFragments[fragmentIndex + 1];

        // 1. Rewrite IDs to be globally unique
        // Format: "beat_{beatId}_{originalNodeId}"
        const prefix = `beat_${fragment.beatId}_`;

        // First pass: Build a set of all valid node IDs in this fragment (without prefix)
        const validNodeIds = new Set(fragment.nodes.map(n => n.id));

        // We need to map over nodes and use the index to resolve "NEXT"
        const processedNodes = fragment.nodes.map((node, nodeIndex) => {
            const newNodeId = node.id.startsWith(prefix) ? node.id : `${prefix}${node.id}`;

            const newChoices = node.choices.map(choice => {
                let targetId = choice.nextNodeId;

                // --- CASE A: Internal "NEXT" Placeholder ---
                // The AI (or our fallback logic) used "NEXT" to mean "the immediate next node in this list".
                if (targetId === "NEXT" || targetId === "NEXT_PLACEHOLDER") {
                    const nextNodeInFragment = fragment.nodes[nodeIndex + 1];
                    if (nextNodeInFragment) {
                        // Link to the next node in this fragment (with prefix)
                        return { ...choice, nextNodeId: `${prefix}${nextNodeInFragment.id}` };
                    } else {
                        // If there is no next node in this fragment, it implicitly means "End of Fragment"
                        targetId = "END_OF_FRAGMENT";
                    }
                }

                // --- CASE B: End of Fragment ---
                // Only if we explicitly hit "END_OF_FRAGMENT" (or fell through from above)
                if (targetId === "END_OF_FRAGMENT") {
                    // Point to the FIRST node of the NEXT fragment
                    if (nextFragment && nextFragment.nodes.length > 0) {
                        const nextFirstNodeId = `beat_${nextFragment.beatId}_${nextFragment.nodes[0].id}`;
                        return { ...choice, nextNodeId: nextFirstNodeId, text: choice.text === "继续" ? "继续" : choice.text };
                    } else {
                        // No next fragment? This is the END of the story.
                        return { ...choice, nextNodeId: "THE_END", text: "终" };
                    }
                }

                // --- CASE C: Dangling Reference Detection ---
                // If the AI generated a reference to a node that doesn't exist in this fragment
                if (!validNodeIds.has(targetId) && targetId !== "THE_END") {
                    console.warn(`[ScriptAssembler] Dangling reference detected: "${targetId}" in beat ${fragment.beatId}. Redirecting to safe fallback.`);

                    // Try to link to the next node in sequence
                    const nextNodeInFragment = fragment.nodes[nodeIndex + 1];
                    if (nextNodeInFragment) {
                        return { ...choice, nextNodeId: `${prefix}${nextNodeInFragment.id}` };
                    } else {
                        // If this is the last node, redirect to END_OF_FRAGMENT
                        targetId = "END_OF_FRAGMENT";
                        if (nextFragment && nextFragment.nodes.length > 0) {
                            const nextFirstNodeId = `beat_${nextFragment.beatId}_${nextFragment.nodes[0].id}`;
                            return { ...choice, nextNodeId: nextFirstNodeId, text: choice.text };
                        } else {
                            return { ...choice, nextNodeId: "THE_END", text: choice.text };
                        }
                    }
                }

                // --- CASE D: Normal Local Link ---
                // If the AI linked to a specific ID (e.g. "node_3"), we just prefix it.
                return { ...choice, nextNodeId: `${prefix}${targetId}` };
            });

            return {
                ...node,
                id: newNodeId,
                choices: newChoices
            };
        });

        // 2. Double Security: Fix the absolute last node of this fragment 
        // If it has NO choices, or its choice points to nothing valid, force link it to next fragment.
        const lastNode = processedNodes[processedNodes.length - 1];
        if (lastNode && !isLastFragment && nextFragment && nextFragment.nodes.length > 0) {
            const nextFirstNodeId = `beat_${nextFragment.beatId}_${nextFragment.nodes[0].id}`;

            // Check if it already links to the next fragment
            const linksToNext = lastNode.choices.some(c => c.nextNodeId === nextFirstNodeId);

            if (!linksToNext) {
                // If it's a linear node (or empty), just override/append
                if (lastNode.choices.length <= 1) {
                    lastNode.choices = [{ text: "继续", nextNodeId: nextFirstNodeId }];
                }
                // If it's a branching node, we assume the AI handled logic, but this is risky.
                //Ideally, branches should eventually merge or hit END_OF_FRAGMENT.
            }
        }

        allNodes.push(...processedNodes);
    });

    // 3. Append explicit THE_END node to avoid "Missing Node" crash
    if (allNodes.length > 0) {
        const lastSceneId = allNodes[allNodes.length - 1].sceneId;
        allNodes.push({
            id: "THE_END",
            characterId: null,
            text: "（本章完）",
            sceneId: lastSceneId || "scene_end",
            choices: [],
            isEnding: true,
            visualSpecs: undefined
        });
    }

    return {
        title: outline.title || "未命名剧本",
        synopsis: outline.synopsis || "无简介",
        characters: outline.characters || [],
        scenes: outline.scenes || [],
        nodes: allNodes,
        startNodeId: allNodes.length > 0 ? allNodes[0].id : "error_no_nodes"
    };
};
