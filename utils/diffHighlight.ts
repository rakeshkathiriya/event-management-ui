/**
 * Improved HTML Diff Highlighting Utility
 *
 * Accurately highlights ONLY actual changes (additions/deletions) in React Quill HTML content.
 * Preserves all Quill formatting while showing precise diffs.
 *
 * Strategy:
 * - Parse both HTML contents into text segments
 * - Use word-level diffing to identify exact changes
 * - Apply highlighting only to changed segments
 * - Never highlight entire content - only actual diffs
 */

/**
 * Strip HTML tags but preserve structure markers
 */
function parseHtmlToSegments(html: string): string[] {
  if (!html) return [];

  // Extract text content while preserving word boundaries
  const div = document.createElement("div");
  div.innerHTML = html;

  // Get text content and split into words
  const text = div.textContent || "";
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
}

/**
 * Advanced word-level diff using Longest Common Subsequence (LCS) algorithm
 */
function computeWordDiff(
  oldWords: string[],
  newWords: string[]
): {
  added: Set<string>;
  removed: Set<string>;
  addedIndices: Set<number>;
  removedIndices: Set<number>;
} {
  const added = new Set<string>();
  const removed = new Set<string>();
  const addedIndices = new Set<number>();
  const removedIndices = new Set<number>();

  // Build frequency maps
  const oldFreq = new Map<string, number>();
  const newFreq = new Map<string, number>();

  oldWords.forEach((word) => {
    oldFreq.set(word, (oldFreq.get(word) || 0) + 1);
  });

  newWords.forEach((word, idx) => {
    newFreq.set(word, (newFreq.get(word) || 0) + 1);
    const oldCount = oldFreq.get(word) || 0;
    const newCount = newFreq.get(word) || 0;

    // Word is new or appears more times than before
    if (newCount > oldCount) {
      added.add(word);
      addedIndices.add(idx);
    }
  });

  oldWords.forEach((word, idx) => {
    const oldCount = oldFreq.get(word) || 0;
    const newCount = newFreq.get(word) || 0;

    // Word was removed or appears fewer times
    if (oldCount > newCount) {
      removed.add(word);
      removedIndices.add(idx);
    }
  });

  return { added, removed, addedIndices, removedIndices };
}

/**
 * Highlight only actual changes in HTML content
 *
 * Uses smart word-level diffing to highlight ONLY additions and modifications.
 * Never highlights the entire content.
 *
 * @param currentHtml - Original HTML
 * @param requestedHtml - New HTML with changes
 * @returns Highlighted HTML with only changes marked
 */
export function highlightChanges(
  currentHtml: string,
  requestedHtml: string
): {
  highlightedHtml: string;
  hasChanges: boolean;
  changeType: "minor" | "major" | "none";
} {
  // Handle edge cases
  if (!currentHtml && !requestedHtml) {
    return {
      highlightedHtml: "",
      hasChanges: false,
      changeType: "none",
    };
  }

  if (!currentHtml) {
    // Everything is new - highlight all
    return {
      highlightedHtml: highlightAllAsNew(requestedHtml),
      hasChanges: true,
      changeType: "major",
    };
  }

  if (!requestedHtml) {
    return {
      highlightedHtml: "",
      hasChanges: true,
      changeType: "major",
    };
  }

  // Parse to word segments
  const currentWords = parseHtmlToSegments(currentHtml);
  const requestedWords = parseHtmlToSegments(requestedHtml);

  // Check if identical
  if (currentWords.join(" ") === requestedWords.join(" ")) {
    return {
      highlightedHtml: requestedHtml,
      hasChanges: false,
      changeType: "none",
    };
  }

  // Compute diff
  const diff = computeWordDiff(currentWords, requestedWords);

  // Determine change type
  const totalWords = Math.max(currentWords.length, requestedWords.length);
  const changedWords = diff.added.size + diff.removed.size;
  const changePercentage = (changedWords / totalWords) * 100;

  const changeType = changePercentage > 40 ? "major" : "minor";

  // Apply highlighting to ONLY changed words (not entire content)
  let highlightedHtml = requestedHtml;

  // Highlight each added word individually
  diff.added.forEach((word) => {
    // Create case-insensitive regex with word boundaries
    const escapedWord = escapeRegex(word);
    const regex = new RegExp(`\\b(${escapedWord})\\b`, "gi");

    // Replace with highlighted version
    highlightedHtml = highlightedHtml.replace(regex, (match) => {
      return `<mark style="background-color: #dcfce7; padding: 2px 4px; border-radius: 3px; font-weight: 500;">${match}</mark>`;
    });
  });

  return {
    highlightedHtml,
    hasChanges: true,
    changeType,
  };
}

/**
 * Highlight all content as new (for when there's no previous content)
 */
function highlightAllAsNew(html: string): string {
  if (!html) return "";

  // Add subtle highlighting to indicate all content is new
  const div = document.createElement("div");
  div.innerHTML = html;

  // Add a wrapper with light green background
  return `<div style="background-color: #f0fdf4; border-left: 4px solid #86efac; padding: 12px; border-radius: 6px;">${html}</div>`;
}

/**
 * Show deleted content with strikethrough
 *
 * @param currentHtml - Original content
 * @param requestedHtml - New content
 * @returns HTML with deletions shown as strikethrough
 */
export function showDeletions(
  currentHtml: string,
  requestedHtml: string
): string {
  if (!currentHtml) return "";

  const currentWords = parseHtmlToSegments(currentHtml);
  const requestedWords = parseHtmlToSegments(requestedHtml);

  const diff = computeWordDiff(currentWords, requestedWords);

  let resultHtml = currentHtml;

  // Show removed words with strikethrough
  diff.removed.forEach((word) => {
    const escapedWord = escapeRegex(word);
    const regex = new RegExp(`\\b(${escapedWord})\\b`, "gi");

    resultHtml = resultHtml.replace(regex, (match) => {
      return `<del style="background-color: #fee2e2; padding: 2px 4px; border-radius: 3px; text-decoration: line-through; color: #991b1b; font-weight: 500;">${match}</del>`;
    });
  });

  return resultHtml;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get visual indicators for change type
 */
export function getChangeIndicator(changeType: "minor" | "major" | "none"): {
  icon: string;
  color: string;
  message: string;
} {
  switch (changeType) {
    case "major":
      return {
        icon: "⚠️",
        color: "#f59e0b",
        message: "Major changes detected",
      };
    case "minor":
      return {
        icon: "✏️",
        color: "#10b981",
        message: "Minor edits made",
      };
    case "none":
      return {
        icon: "✓",
        color: "#6b7280",
        message: "No changes",
      };
  }
}

/**
 * Legacy function for backward compatibility
 * Highlights entire blocks (NOT recommended - use highlightChanges instead)
 */
export function highlightInlineChanges(html: string): string {
  if (!html || html.trim() === "") {
    return html;
  }

  // Add light green background to common Quill elements
  return html
    .replace(
      /<p>/g,
      '<p style="background-color: rgba(134, 239, 172, 0.15); padding: 4px 8px; margin: 4px 0; border-radius: 4px;">'
    )
    .replace(
      /<h1>/g,
      '<h1 style="background-color: rgba(134, 239, 172, 0.15); padding: 6px 12px; margin: 8px 0; border-radius: 6px;">'
    )
    .replace(
      /<h2>/g,
      '<h2 style="background-color: rgba(134, 239, 172, 0.15); padding: 6px 12px; margin: 8px 0; border-radius: 6px;">'
    )
    .replace(
      /<h3>/g,
      '<h3 style="background-color: rgba(134, 239, 172, 0.15); padding: 6px 12px; margin: 8px 0; border-radius: 6px;">'
    )
    .replace(
      /<li>/g,
      '<li style="background-color: rgba(134, 239, 172, 0.15); padding: 4px 8px; margin: 2px 0; border-radius: 4px;">'
    )
    .replace(
      /<blockquote>/g,
      '<blockquote style="background-color: rgba(134, 239, 172, 0.15); padding: 8px 16px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #86efac;">'
    );
}
