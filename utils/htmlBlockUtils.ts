/**
 * HTML Block Utilities for React Quill Content
 *
 * This module provides utilities to:
 * 1. Parse React Quill HTML into normalized blocks
 * 2. Reconstruct HTML from blocks
 * 3. Maintain stable ordering and formatting
 *
 * Block Structure:
 * - Each block represents a logical content unit (paragraph, heading, list item)
 * - Blocks preserve formatting tags (strong, em, u, s, etc.)
 * - Blocks have unique IDs for tracking
 */

export interface HtmlBlock {
  id: string;                    // Unique identifier
  type: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li' | 'ul' | 'ol';
  html: string;                  // Full HTML of the block
  textContent: string;           // Plain text (for comparison)
  index: number;                 // Original position
  parentListType?: 'ul' | 'ol';  // For list items
}

/**
 * Normalize React Quill HTML into ordered blocks
 *
 * @param html - React Quill HTML content
 * @returns Array of normalized blocks in order
 */
export function parseHtmlToBlocks(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];

  if (!html || typeof window === 'undefined') {
    return blocks;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let globalIndex = 0;

  // Process each top-level element in order
  Array.from(doc.body.children).forEach((element) => {
    const tagName = element.tagName.toLowerCase() as HtmlBlock['type'];

    // Handle lists (ul/ol)
    if (tagName === 'ul' || tagName === 'ol') {
      const listType = tagName;

      // Extract each list item as a separate block
      Array.from(element.children).forEach((li) => {
        if (li.tagName === 'LI') {
          const textContent = li.textContent?.trim() || '';

          if (textContent) {
            blocks.push({
              id: `block-${globalIndex}`,
              type: 'li',
              html: li.outerHTML,
              textContent,
              index: globalIndex,
              parentListType: listType,
            });
            globalIndex++;
          }
        }
      });
    }
    // Handle other block elements (p, h1-h6, etc.)
    else if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      const textContent = element.textContent?.trim() || '';

      if (textContent) {
        blocks.push({
          id: `block-${globalIndex}`,
          type: tagName,
          html: element.outerHTML,
          textContent,
          index: globalIndex,
        });
        globalIndex++;
      }
    }
  });

  return blocks;
}

/**
 * Reconstruct React Quill HTML from blocks
 *
 * Groups list items back into ul/ol elements
 * Maintains proper formatting and order
 *
 * @param blocks - Array of blocks to reconstruct
 * @returns Valid React Quill HTML
 */
export function reconstructHtmlFromBlocks(blocks: HtmlBlock[]): string {
  if (blocks.length === 0) {
    return '';
  }

  const elements: string[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];

  // Helper to flush current list
  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      elements.push(`<${currentListType}>${currentListItems.join('')}</${currentListType}>`);
      currentListItems = [];
      currentListType = null;
    }
  };

  // Process blocks in order
  blocks.forEach((block) => {
    if (block.type === 'li') {
      // If starting a new list or same list type, accumulate
      if (currentListType === block.parentListType) {
        currentListItems.push(block.html);
      } else {
        // Flush previous list and start new one
        flushList();
        currentListType = block.parentListType || 'ul';
        currentListItems.push(block.html);
      }
    } else {
      // Non-list element: flush any open list first
      flushList();
      elements.push(block.html);
    }
  });

  // Flush any remaining list
  flushList();

  return elements.join('');
}

/**
 * Compare two blocks for text-level changes
 *
 * Returns true if the text content has meaningfully changed
 * (not just whitespace differences)
 */
export function hasBlockChanged(block1Text: string, block2Text: string): boolean {
  const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalize(block1Text) !== normalize(block2Text);
}

/**
 * Compare two HTML strings for formatting changes
 *
 * Returns true if the HTML structure/formatting has changed
 * even if the text content is the same
 * (e.g., "Hello" vs "<strong>Hello</strong>")
 */
export function hasFormattingChanged(html1: string, html2: string): boolean {
  // Normalize whitespace in HTML for fair comparison
  const normalizeHtml = (html: string) =>
    html.trim().replace(/\s+/g, ' ').replace(/>\s+</g, '><');

  return normalizeHtml(html1) !== normalizeHtml(html2);
}

/**
 * Normalize HTML formatting for consistent comparison
 * Removes extra whitespace and normalizes tags
 */
export function normalizeHtml(html: string): string {
  if (!html || typeof window === 'undefined') {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Return normalized HTML
  return doc.body.innerHTML.trim();
}
