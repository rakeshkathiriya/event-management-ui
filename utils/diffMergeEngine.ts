/**
 * Diff and Merge Engine for React Quill HTML Content
 *
 * This module provides:
 * 1. Accurate block-level diff detection (ADDED, MODIFIED, REMOVED)
 * 2. Stable change model with unique IDs
 * 3. Index-based merge operations
 * 4. Support for multiple independent changes
 *
 * Algorithm:
 * - Parse HTML into blocks
 * - Compare blocks by text content and position
 * - Generate changes with exact original indexes
 * - Apply changes incrementally to base content
 */

import {
  HtmlBlock,
  hasBlockChanged,
  hasFormattingChanged,
  parseHtmlToBlocks,
  reconstructHtmlFromBlocks,
} from './htmlBlockUtils';

/**
 * Represents a detected change between two versions
 */
export interface Change {
  id: string;                     // Unique change ID
  type: 'added' | 'modified' | 'removed';
  originalIndex: number;          // Index in original (current) content
  incomingIndex: number;          // Index in incoming (requested) content
  originalBlock: HtmlBlock | null; // Null for added
  incomingBlock: HtmlBlock | null; // Null for removed
}

/**
 * Compute diff between current and requested HTML
 *
 * Returns all detected changes with exact indexes
 * Changes appear at their actual positions, not appended
 *
 * @param currentHtml - Current saved content
 * @param requestedHtml - User-submitted updates
 * @returns Array of changes
 */
export function computeDiff(currentHtml: string, requestedHtml: string): Change[] {
  const changes: Change[] = [];

  // Parse both versions into blocks
  const currentBlocks = parseHtmlToBlocks(currentHtml);
  const requestedBlocks = parseHtmlToBlocks(requestedHtml);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 [DiffEngine] Starting Diff');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[DiffEngine] Current blocks: ${currentBlocks.length}`);
  console.log(`[DiffEngine] Requested blocks: ${requestedBlocks.length}`);

  // Create lookup maps for efficient matching
  const currentByText = new Map<string, HtmlBlock[]>();
  currentBlocks.forEach((block) => {
    const normalizedText = block.textContent.trim().toLowerCase();
    if (!currentByText.has(normalizedText)) {
      currentByText.set(normalizedText, []);
    }
    currentByText.get(normalizedText)!.push(block);
  });

  // Track which current blocks have been matched
  const matchedCurrentIndices = new Set<number>();

  // First pass: Find exact matches and modifications
  requestedBlocks.forEach((reqBlock, reqIdx) => {
    const normalizedText = reqBlock.textContent.trim().toLowerCase();
    const candidates = currentByText.get(normalizedText) || [];

    // Find first unmatched candidate with same text
    const exactMatch = candidates.find((cb) => !matchedCurrentIndices.has(cb.index));

    if (exactMatch) {
      // Check if text is same but formatting changed
      if (hasFormattingChanged(exactMatch.html, reqBlock.html)) {
        // FORMATTING MODIFIED - same text but different HTML structure
        matchedCurrentIndices.add(exactMatch.index);
        changes.push({
          id: `change-${exactMatch.index}-modified-formatting`,
          type: 'modified',
          originalIndex: exactMatch.index,
          incomingIndex: reqIdx,
          originalBlock: exactMatch,
          incomingBlock: reqBlock,
        });
        console.log(
          `[DiffEngine] 🎨 Block ${reqIdx} FORMATTING MODIFIED (original index ${exactMatch.index})`
        );
      } else {
        // EXACT MATCH - no change needed (same text AND same formatting)
        matchedCurrentIndices.add(exactMatch.index);
        console.log(`[DiffEngine] ✓ Block ${reqIdx} unchanged (matched with ${exactMatch.index})`);
      }
    } else {
      // Check for MODIFICATION (same type, different content)
      const sameTypeBlock = currentBlocks.find(
        (cb) =>
          cb.type === reqBlock.type &&
          !matchedCurrentIndices.has(cb.index) &&
          hasBlockChanged(cb.textContent, reqBlock.textContent)
      );

      if (sameTypeBlock) {
        // MODIFIED - text content changed
        matchedCurrentIndices.add(sameTypeBlock.index);
        changes.push({
          id: `change-${sameTypeBlock.index}-modified`,
          type: 'modified',
          originalIndex: sameTypeBlock.index,
          incomingIndex: reqIdx,
          originalBlock: sameTypeBlock,
          incomingBlock: reqBlock,
        });
        console.log(
          `[DiffEngine] ✏️  Block ${reqIdx} TEXT MODIFIED (original index ${sameTypeBlock.index})`
        );
      } else {
        // ADDED - new block not in current
        changes.push({
          id: `change-${reqIdx}-added`,
          type: 'added',
          originalIndex: -1,
          incomingIndex: reqIdx,
          originalBlock: null,
          incomingBlock: reqBlock,
        });
        console.log(`[DiffEngine] ✨ Block ${reqIdx} ADDED`);
      }
    }
  });

  // Second pass: Find removed blocks
  currentBlocks.forEach((currBlock, currIdx) => {
    if (!matchedCurrentIndices.has(currIdx)) {
      // REMOVED - existed in current but not in requested
      changes.push({
        id: `change-${currIdx}-removed`,
        type: 'removed',
        originalIndex: currIdx,
        incomingIndex: -1,
        originalBlock: currBlock,
        incomingBlock: null,
      });
      console.log(`[DiffEngine] 🗑️  Block ${currIdx} REMOVED`);
    }
  });

  // Sort changes by original index for stable ordering
  changes.sort((a, b) => {
    if (a.originalIndex === -1) return 1; // Added items go to end
    if (b.originalIndex === -1) return -1;
    return a.originalIndex - b.originalIndex;
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[DiffEngine] ✅ Found ${changes.length} changes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return changes;
}

/**
 * Apply accepted changes to base content
 *
 * Handles ADD, MODIFY, REMOVE operations at correct indexes
 * Supports multiple independent changes
 *
 * @param currentHtml - Current saved content
 * @param requestedHtml - User-submitted updates
 * @param acceptedChangeIds - Set of accepted change IDs
 * @returns Merged HTML content
 */
export function applyChanges(
  currentHtml: string,
  requestedHtml: string,
  acceptedChangeIds: Set<string>
): string {
  if (acceptedChangeIds.size === 0) {
    // No changes accepted, return current as-is
    return currentHtml;
  }

  // Get all changes
  const allChanges = computeDiff(currentHtml, requestedHtml);

  // Filter to only accepted changes
  const acceptedChanges = allChanges.filter((change) => acceptedChangeIds.has(change.id));

  if (acceptedChanges.length === 0) {
    return currentHtml;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 [MergeEngine] Applying Changes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[MergeEngine] Accepted changes: ${acceptedChanges.length}`);

  // Start with current blocks
  let resultBlocks = parseHtmlToBlocks(currentHtml);

  // Sort changes by operation priority:
  // 1. Removals (descending index - remove from end first to preserve indexes)
  // 2. Modifications (any order)
  // 3. Additions (ascending index)
  const removals = acceptedChanges.filter((c) => c.type === 'removed').sort((a, b) => b.originalIndex - a.originalIndex);
  const modifications = acceptedChanges.filter((c) => c.type === 'modified');
  const additions = acceptedChanges.filter((c) => c.type === 'added').sort((a, b) => a.incomingIndex - b.incomingIndex);

  // Apply REMOVALS first (from end to start)
  removals.forEach((change) => {
    console.log(`[MergeEngine] 🗑️  Removing block at index ${change.originalIndex}`);
    resultBlocks = resultBlocks.filter((block) => block.index !== change.originalIndex);
  });

  // Apply MODIFICATIONS
  modifications.forEach((change) => {
    console.log(`[MergeEngine] ✏️  Modifying block at index ${change.originalIndex}`);
    const targetIndex = resultBlocks.findIndex((block) => block.index === change.originalIndex);
    if (targetIndex !== -1 && change.incomingBlock) {
      // Replace with incoming block but preserve original index
      resultBlocks[targetIndex] = {
        ...change.incomingBlock,
        index: change.originalIndex,
      };
    }
  });

  // Apply ADDITIONS
  additions.forEach((change) => {
    if (change.incomingBlock) {
      console.log(`[MergeEngine] ✨ Adding block at position ${change.incomingIndex}`);

      // Determine insertion position
      // If incoming index is within current length, insert at that position
      // Otherwise append to end
      const insertPosition = Math.min(change.incomingIndex, resultBlocks.length);

      // Create new block with proper index
      const newBlock: HtmlBlock = {
        ...change.incomingBlock,
        index: resultBlocks.length, // Assign next available index
      };

      // Insert at position
      resultBlocks.splice(insertPosition, 0, newBlock);
    }
  });

  // Re-index all blocks to maintain sequential order
  resultBlocks = resultBlocks.map((block, idx) => ({
    ...block,
    index: idx,
  }));

  console.log(`[MergeEngine] ✅ Result: ${resultBlocks.length} blocks`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Reconstruct HTML
  return reconstructHtmlFromBlocks(resultBlocks);
}
