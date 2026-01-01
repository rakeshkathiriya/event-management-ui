import { diff_match_patch } from "diff-match-patch";

/**
 * Line-level diff engine for HTML content with arrow-based merging
 */

export type ChangeType = "unchanged" | "added" | "removed" | "modified";

export interface LineChange {
  id: string;
  type: ChangeType;
  currentLine?: string; // HTML content from current version
  incomingLine?: string; // HTML content from incoming version
  lineNumber: number;
  isMerged: boolean; // Has this line been merged via arrow click?
}

export interface DiffResult {
  changes: LineChange[];
  hasChanges: boolean;
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

/**
 * Parse HTML into line-level blocks (paragraphs, headings, lists, etc.)
 */
function parseHtmlToLines(html: string): string[] {
  if (!html || html.trim() === "") return [];

  if (typeof window === "undefined") {
    return [html.trim()];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const lines: string[] = [];

  // Extract block-level elements
  const blockElements = doc.body.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div"
  );

  if (blockElements.length === 0) {
    const trimmed = html.trim();
    return trimmed ? [trimmed] : [];
  }

  blockElements.forEach((el) => {
    const outerHTML = el.outerHTML;
    if (outerHTML && outerHTML.trim()) {
      lines.push(outerHTML);
    }
  });

  return lines;
}

/**
 * Normalize line content for comparison
 */
function normalizeLine(line: string): string {
  if (typeof window === "undefined") {
    return line
      .replace(/<[^>]*>/g, "")
      .trim()
      .toLowerCase();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(line, "text/html");
  const text = doc.body.textContent || "";
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Compute LCS for line-by-line diff
 */
function computeLCS(arr1: string[], arr2: string[]): number[][] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizeLine(arr1[i - 1]) === normalizeLine(arr2[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Generate line-by-line changes for arrow-based merging
 */
function generateLineChanges(
  currentLines: string[],
  incomingLines: string[],
  lcs: number[][]
): LineChange[] {
  const changes: LineChange[] = [];
  let i = currentLines.length;
  let j = incomingLines.length;
  let lineNumber = 0;

  const operations: Array<{ type: ChangeType; currentIdx?: number; incomingIdx?: number }> = [];

  // Backtrack through LCS
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      normalizeLine(currentLines[i - 1]) === normalizeLine(incomingLines[j - 1])
    ) {
      operations.unshift({ type: "unchanged", currentIdx: i - 1, incomingIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      operations.unshift({ type: "added", incomingIdx: j - 1 });
      j--;
    } else if (i > 0) {
      operations.unshift({ type: "removed", currentIdx: i - 1 });
      i--;
    }
  }

  // Convert to LineChange objects
  return operations.map((op, idx) => {
    const change: LineChange = {
      id: `line-${idx}-${Date.now()}-${Math.random()}`,
      type: op.type,
      lineNumber: lineNumber++,
      isMerged: false, // Initially not merged
    };

    if (op.currentIdx !== undefined) {
      change.currentLine = currentLines[op.currentIdx];
    }
    if (op.incomingIdx !== undefined) {
      change.incomingLine = incomingLines[op.incomingIdx];
    }

    return change;
  });
}

/**
 * Calculate diff statistics
 */
function calculateStats(changes: LineChange[]): {
  additions: number;
  deletions: number;
  modifications: number;
} {
  return {
    additions: changes.filter((c) => c.type === "added").length,
    deletions: changes.filter((c) => c.type === "removed").length,
    modifications: changes.filter((c) => c.type === "modified").length,
  };
}

/**
 * Parse HTML into line-level diff for arrow-based merging
 */
export function parseLineLevelDiff(currentHtml: string, incomingHtml: string): DiffResult {
  const currentLines = parseHtmlToLines(currentHtml);
  const incomingLines = parseHtmlToLines(incomingHtml);

  if (currentLines.length === 0 && incomingLines.length === 0) {
    return {
      changes: [],
      hasChanges: false,
      stats: { additions: 0, deletions: 0, modifications: 0 },
    };
  }

  const lcs = computeLCS(currentLines, incomingLines);
  const changes = generateLineChanges(currentLines, incomingLines, lcs);
  const stats = calculateStats(changes);

  return {
    changes,
    hasChanges: changes.some((c) => c.type !== "unchanged"),
    stats,
  };
}

/**
 * Generate final merged content from current version + merged changes
 *
 * Strategy: Start with current version, then apply merged changes
 */
export function generateFinalMergedContent(changes: LineChange[]): string {
  const result: string[] = [];

  for (const change of changes) {
    if (change.type === "unchanged") {
      // Always include unchanged lines from current
      result.push(change.currentLine || change.incomingLine || "");
    } else if (change.type === "removed") {
      // Keep removed lines from current UNLESS they've been merged (which means "accept removal")
      if (!change.isMerged) {
        result.push(change.currentLine || "");
      }
      // If isMerged, skip (accept the removal)
    } else if (change.type === "added") {
      // Only include added lines if they've been merged
      if (change.isMerged) {
        result.push(change.incomingLine || "");
      }
    } else if (change.type === "modified") {
      // Use incoming if merged, otherwise keep current
      if (change.isMerged) {
        result.push(change.incomingLine || "");
      } else {
        result.push(change.currentLine || "");
      }
    }
  }

  return result.join("");
}

const dmp = new diff_match_patch();

/**
 * Detects even small text changes (word, punctuation, sentence)
 * Returns true if ANY word / character / punctuation differs
 */
export const hasTextLevelChange = (oldText: string, newText: string): boolean => {
  if (oldText === newText) return false;

  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  // Any insert or delete = real change
  return diffs.some(([op]) => op !== 0);
};
