/**
 * Utility for highlighting changes between HTML content
 *
 * Used in admin review to show what users have changed in their update requests.
 */

/**
 * Strip HTML tags and get plain text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Simple word-level diff algorithm
 * Returns arrays of added and removed words
 */
function getWordDiff(
  oldText: string,
  newText: string
): {
  added: Set<string>;
  removed: Set<string>;
  hasChanges: boolean;
} {
  const oldWords = new Set(
    oldText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0)
  );
  const newWords = new Set(
    newText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0)
  );

  const added = new Set<string>();
  const removed = new Set<string>();

  // Find added words
  newWords.forEach((word) => {
    if (!oldWords.has(word)) {
      added.add(word);
    }
  });

  // Find removed words
  oldWords.forEach((word) => {
    if (!newWords.has(word)) {
      removed.add(word);
    }
  });

  return {
    added,
    removed,
    hasChanges: added.size > 0 || removed.size > 0,
  };
}

/**
 * Highlight changed content in HTML
 *
 * Strategy:
 * - If content is significantly different (>30% change), highlight everything
 * - Otherwise, highlight specific words/phrases that changed
 *
 * @param currentHtml - Original HTML content
 * @param requestedHtml - New HTML content
 * @returns Object with highlighted HTML and metadata
 */
export function highlightChanges(
  currentHtml: string,
  requestedHtml: string
): {
  highlightedHtml: string;
  hasChanges: boolean;
  changeType: "minor" | "major" | "none";
} {
  if (!currentHtml || !requestedHtml) {
    return {
      highlightedHtml: requestedHtml,
      hasChanges: true,
      changeType: "major",
    };
  }

  const currentText = stripHtml(currentHtml);
  const requestedText = stripHtml(requestedHtml);

  // Check if content is identical
  if (currentText === requestedText) {
    return {
      highlightedHtml: requestedHtml,
      hasChanges: false,
      changeType: "none",
    };
  }

  const diff = getWordDiff(currentText, requestedText);

  // Calculate change percentage
  const totalWords = new Set([
    ...currentText.split(/\s+/),
    ...requestedText.split(/\s+/),
  ]).size;
  const changedWords = diff.added.size + diff.removed.size;
  const changePercentage = (changedWords / totalWords) * 100;

  // If major rewrite (>40% changed), highlight entire content
  if (changePercentage > 40) {
    return {
      highlightedHtml: wrapWithHighlight(requestedHtml, "major"),
      hasChanges: true,
      changeType: "major",
    };
  }

  // For minor changes, highlight specific added words
  let highlightedHtml = requestedHtml;

  // Highlight added words with light green background
  diff.added.forEach((word) => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    highlightedHtml = highlightedHtml.replace(
      regex,
      `<mark style="background-color: #dcfce7; padding: 2px 4px; border-radius: 3px;">$&</mark>`
    );
  });

  return {
    highlightedHtml,
    hasChanges: true,
    changeType: "minor",
  };
}

/**
 * Wrap entire HTML content with highlight styling
 */
function wrapWithHighlight(html: string, type: "major" | "minor"): string {
  const bgColor = type === "major" ? "#f0fdf4" : "#dcfce7";
  const borderColor = type === "major" ? "#86efac" : "#bbf7d0";

  return `
    <div style="
      background-color: ${bgColor};
      border-left: 4px solid ${borderColor};
      padding: 16px;
      border-radius: 8px;
      margin: 4px 0;
    ">
      ${html}
    </div>
  `;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apply inline highlighting to HTML elements (legacy approach)
 *
 * This applies a subtle green background to all content elements.
 * Used when you want to highlight the entire requested description.
 */
export function highlightInlineChanges(html: string): string {
  if (!html || html.trim() === "") {
    return html;
  }

  // Add light green background to common Quill elements
  const styledHtml = html
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

  return styledHtml;
}

/**
 * Show deleted content with strikethrough (for admin review)
 *
 * @param currentHtml - Original content
 * @param requestedHtml - New content
 * @returns HTML with deletions shown
 */
export function showDeletions(
  currentHtml: string,
  requestedHtml: string
): string {
  if (!currentHtml) return requestedHtml;

  const currentText = stripHtml(currentHtml);
  const requestedText = stripHtml(requestedHtml);

  const diff = getWordDiff(currentText, requestedText);

  let resultHtml = currentHtml;

  // Show removed words with strikethrough and red background
  diff.removed.forEach((word) => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
    resultHtml = resultHtml.replace(
      regex,
      `<del style="background-color: #fee2e2; padding: 2px 4px; border-radius: 3px; text-decoration: line-through; color: #991b1b;">$&</del>`
    );
  });

  return resultHtml;
}

/**
 * Get visual indicators for changes
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
