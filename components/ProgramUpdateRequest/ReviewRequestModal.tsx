"use client";

import { ProgramUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle, X, XCircle } from "lucide-react";
import "quill/dist/quill.snow.css";
import { useMemo, useState } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ReviewRequestModalProps {
  request: ProgramUpdateRequest;
  onClose: () => void;
  onApprove: (requestId: string, finalMergedContent: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  onApproveSuccess?: () => void;
  onApproveError?: (error: Error) => void;
  onRejectSuccess?: () => void;
  onRejectError?: (error: Error) => void;
}

/**
 * Represents a single line in the diff comparison (IntelliJ-style)
 */
interface DiffLine {
  id: string;
  type: "added" | "removed" | "unchanged" | "modified";
  currentHtml: string | null; // HTML from current version (null if added)
  requestedHtml: string | null; // HTML from requested version (null if removed)
  currentLineNumber: number;
  requestedLineNumber: number;
  textContent: string; // For display
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract individual lines from HTML, handling nested elements like <li> inside <ul>
 * FIX: This prevents list duplication by treating each <li> as a separate line
 */
const extractLines = (html: string): Array<{ html: string; text: string }> => {
  const lines: Array<{ html: string; text: string }> = [];

  if (!html || typeof window === "undefined") return lines;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Process each top-level element
  Array.from(doc.body.children).forEach((element) => {
    // If it's a list (ul/ol), extract each list item individually
    if (element.tagName === "UL" || element.tagName === "OL") {
      Array.from(element.children).forEach((li) => {
        if (li.tagName === "LI" && li.textContent?.trim()) {
          lines.push({
            html: li.outerHTML.trim(),
            text: li.textContent.trim(),
          });
        }
      });
    } else {
      // For other elements (p, h1, etc.), treat as single line
      if (element.textContent?.trim()) {
        lines.push({
          html: element.outerHTML.trim(),
          text: element.textContent.trim(),
        });
      }
    }
  });

  return lines;
};

/**
 * Get HTML tag name from an HTML string
 */
const getTagName = (html: string): string => {
  const match = html.match(/^<(\w+)/);
  return match ? match[1].toUpperCase() : "";
};

/**
 * LINE-BY-LINE DIFF COMPARISON (IntelliJ IDEA Style)
 *
 * Compares HTML content line by line and returns a list of all lines
 * with their status (added, removed, unchanged, modified).
 *
 * Handles:
 * - ADDED: New lines in requested
 * - REMOVED: Lines deleted from current
 * - MODIFIED: Lines with same tag but different content (e.g., heading text changed)
 * - UNCHANGED: Identical lines
 */
const computeLineByLineDiff = (currentHtml: string, requestedHtml: string): DiffLine[] => {
  const lines: DiffLine[] = [];

  // Guard against missing data or SSR
  if (typeof window === "undefined") {
    console.warn("[LineByLineDiff] Skipping - running on server");
    return lines;
  }

  // FIX: Extract individual lines (including nested <li> elements)
  const currentLines = extractLines(currentHtml || "");
  const requestedLines = extractLines(requestedHtml || "");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 [LineByLineDiff] STARTING");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`[LineByLineDiff] Current lines: ${currentLines.length}`);
  console.log(`[LineByLineDiff] Requested lines: ${requestedLines.length}`);

  // Create maps for O(1) lookup
  const currentLinesMap = new Map<string, number[]>();
  const currentLinesByTag = new Map<string, Array<{ html: string; text: string; index: number }>>();

  currentLines.forEach((line, idx) => {
    // Exact match map
    if (!currentLinesMap.has(line.html)) {
      currentLinesMap.set(line.html, []);
    }
    currentLinesMap.get(line.html)!.push(idx);

    // Tag-based map for detecting modifications
    const tag = getTagName(line.html);
    if (!currentLinesByTag.has(tag)) {
      currentLinesByTag.set(tag, []);
    }
    currentLinesByTag.get(tag)!.push({ ...line, index: idx });
  });

  const processedCurrentIndices = new Set<number>();
  let detectedChanges = 0;

  // Process each line from requested version
  requestedLines.forEach((requestedLine, reqIdx) => {
    const matchIndices = currentLinesMap.get(requestedLine.html);

    if (matchIndices && matchIndices.length > 0) {
      // UNCHANGED: Exact match found
      const currentIdx = matchIndices[0];
      processedCurrentIndices.add(currentIdx);

      lines.push({
        id: `line-${reqIdx}-unchanged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "unchanged",
        currentHtml: requestedLine.html,
        requestedHtml: requestedLine.html,
        currentLineNumber: currentIdx,
        requestedLineNumber: reqIdx,
        textContent: requestedLine.text,
      });
      console.log(`[LineByLineDiff] ✓ Line ${reqIdx} unchanged: ${requestedLine.text.substring(0, 40)}`);
    } else {
      // Check if this might be a MODIFICATION (same tag, different content)
      const tag = getTagName(requestedLine.html);
      const sameTagLines = currentLinesByTag.get(tag) || [];
      const unprocessedSameTag = sameTagLines.find(cl => !processedCurrentIndices.has(cl.index));

      if (unprocessedSameTag && tag !== "LI") {
        // MODIFIED: Same tag type but different content (e.g., heading text changed)
        detectedChanges++;
        processedCurrentIndices.add(unprocessedSameTag.index);

        lines.push({
          id: `line-${reqIdx}-modified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "modified",
          currentHtml: unprocessedSameTag.html,
          requestedHtml: requestedLine.html,
          currentLineNumber: unprocessedSameTag.index,
          requestedLineNumber: reqIdx,
          textContent: requestedLine.text,
        });
        console.log(`[LineByLineDiff] ✏️  Line ${reqIdx} MODIFIED: "${unprocessedSameTag.text.substring(0, 30)}" → "${requestedLine.text.substring(0, 30)}"`);
      } else {
        // ADDED: Completely new line
        detectedChanges++;

        lines.push({
          id: `line-${reqIdx}-added-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "added",
          currentHtml: null,
          requestedHtml: requestedLine.html,
          currentLineNumber: -1,
          requestedLineNumber: reqIdx,
          textContent: requestedLine.text,
        });
        console.log(`[LineByLineDiff] ✨ Line ${reqIdx} ADDED: ${requestedLine.text.substring(0, 40)}`);
      }
    }
  });

  // Find REMOVED lines (exist in current but not in requested)
  currentLines.forEach((currentLine, currIdx) => {
    if (!processedCurrentIndices.has(currIdx)) {
      detectedChanges++;

      lines.push({
        id: `line-removed-${currIdx}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "removed",
        currentHtml: currentLine.html,
        requestedHtml: null,
        currentLineNumber: currIdx,
        requestedLineNumber: -1,
        textContent: currentLine.text,
      });
      console.log(`[LineByLineDiff] 🗑️  Line REMOVED: ${currentLine.text.substring(0, 40)}`);
    }
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`[LineByLineDiff] ✅ RESULT: ${lines.length} total lines, ${detectedChanges} changed`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return lines;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Conflict Resolution Modal for Program Update Requests
 *
 * Features:
 * - Three-column layout: Existing Changes | Final Changes | Latest Changes
 * - Interactive accept/discard controls for new changes
 * - Live preview of merged result
 * - Fully responsive (desktop/tablet/mobile)
 * - Preserves React Quill HTML formatting
 * - Type-safe implementation
 */
const ReviewRequestModal: React.FC<ReviewRequestModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  onApproveSuccess,
  onApproveError,
  onRejectSuccess,
  onRejectError,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Track which changes have been accepted (key = blockId, value = true if accepted)
  const [acceptedChanges, setAcceptedChanges] = useState<Record<string, boolean>>({});

  // FIX: Add toggle to show ALL blocks if diff detection fails
  const [showAllBlocks, setShowAllBlocks] = useState(false);

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  // FIX: Defensive check - ensure request._id exists before allowing actions
  const isValidRequest = !!request._id;
  const isPending = request.status === "pending";

  // ============================================================================
  // LINE-BY-LINE DIFF COMPUTATION (IntelliJ IDEA Style)
  // ============================================================================

  /**
   * Compute line-by-line diff between current and requested descriptions
   * Returns ALL lines with their status (unchanged, added, modified)
   * Arrows will show for EVERY line that is added or modified
   */
  const diffLines = useMemo(() => {
    // Ensure data exists before computing diff
    if (!request._id) {
      console.warn("[LineByLineDiff] Request not ready yet (no _id)");
      return [];
    }

    if (!request.requestedDescription) {
      console.warn("[LineByLineDiff] No requested description in request");
      return [];
    }

    console.log("[LineByLineDiff] Computing for request:", request._id);
    console.log(
      "[LineByLineDiff] Current snapshot length:",
      request.currentDescriptionSnapshot?.length || 0
    );
    console.log(
      "[LineByLineDiff] Requested description length:",
      request.requestedDescription?.length || 0
    );

    const lines = computeLineByLineDiff(
      request.currentDescriptionSnapshot || "",
      request.requestedDescription || ""
    );

    const changedCount = lines.filter((l) => l.type === "added" || l.type === "modified").length;
    console.log(`[LineByLineDiff] Result: ${lines.length} total lines, ${changedCount} changed`);
    return lines;
  }, [request._id, request.currentDescriptionSnapshot, request.requestedDescription]);

  // ============================================================================
  // MERGED OUTPUT GENERATION
  // ============================================================================

  /**
   * Generate final merged HTML content
   *
   * Logic:
   * 1. Start with current description
   * 2. Apply accepted changes:
   *    - ADDED: Append new content
   *    - MODIFIED: Replace old content with new
   *    - REMOVED: Delete content
   *
   * FIX: Properly handles add/modify/remove without duplication
   */
  const mergedHtml = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(request.currentDescriptionSnapshot || "<div></div>", "text/html");

    // Extract current elements for modification/removal tracking
    const currentElements = extractLines(doc.body.innerHTML);

    // Track which current elements to remove
    const elementsToRemove = new Set<number>();

    // Process each accepted change
    diffLines.forEach((line) => {
      if (!acceptedChanges[line.id]) return;

      if (line.type === "added") {
        // ADDED: Append new content
        if (line.requestedHtml?.startsWith("<li")) {
          // Append to existing list
          const existingList = doc.body.querySelector("ul, ol");
          if (existingList) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = line.requestedHtml;
            const liElement = tempDiv.firstElementChild;
            if (liElement) {
              existingList.appendChild(liElement.cloneNode(true));
            }
          }
        } else {
          // Append other elements
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = line.requestedHtml!;
          if (tempDiv.firstElementChild) {
            doc.body.appendChild(tempDiv.firstElementChild.cloneNode(true));
          }
        }
      } else if (line.type === "modified") {
        // MODIFIED: Replace old with new
        elementsToRemove.add(line.currentLineNumber);

        if (line.requestedHtml?.startsWith("<li")) {
          // Replace list item
          const existingList = doc.body.querySelector("ul, ol");
          if (existingList) {
            const listItems = Array.from(existingList.children);
            const targetItem = listItems[line.currentLineNumber];
            if (targetItem) {
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = line.requestedHtml;
              const newLiElement = tempDiv.firstElementChild;
              if (newLiElement) {
                existingList.replaceChild(newLiElement.cloneNode(true), targetItem);
              }
            }
          }
        } else {
          // Replace other elements (headings, paragraphs)
          const allElements = Array.from(doc.body.children);
          let elementIndex = 0;
          for (const elem of allElements) {
            if (elem.tagName !== "UL" && elem.tagName !== "OL") {
              if (elementIndex === line.currentLineNumber) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = line.requestedHtml!;
                const newElement = tempDiv.firstElementChild;
                if (newElement) {
                  doc.body.replaceChild(newElement.cloneNode(true), elem);
                }
                break;
              }
              elementIndex++;
            }
          }
        }
      } else if (line.type === "removed") {
        // REMOVED: Mark for deletion
        elementsToRemove.add(line.currentLineNumber);
      }
    });

    // Remove marked elements
    if (elementsToRemove.size > 0 && diffLines.some(l => acceptedChanges[l.id] && l.type === "removed")) {
      const existingList = doc.body.querySelector("ul, ol");
      if (existingList) {
        const listItems = Array.from(existingList.children);
        listItems.forEach((item, idx) => {
          if (elementsToRemove.has(idx)) {
            item.remove();
          }
        });
      }
    }

    return doc.body.innerHTML;
  }, [request.currentDescriptionSnapshot, diffLines, acceptedChanges]);

  // ============================================================================
  // INTERACTION HANDLERS
  // ============================================================================

  /**
   * Accept a change from Latest Changes
   * Moves the change into Final Changes column
   */
  const handleAcceptChange = (blockId: string) => {
    setAcceptedChanges((prev) => ({ ...prev, [blockId]: true }));
  };

  /**
   * Discard an accepted change
   * Removes it from Final Changes column
   */
  const handleDiscardChange = (blockId: string) => {
    setAcceptedChanges((prev) => {
      const updated = { ...prev };
      delete updated[blockId];
      return updated;
    });
  };

  /**
   * Approve with merged content
   * Sends final merged HTML to backend
   */
  const handleApprove = async () => {
    // FIX: Defensive check to ensure request._id exists before calling API
    // This prevents "Cast to ObjectId failed for value 'undefined'" error
    if (!isValidRequest) {
      console.error("❌ Cannot approve: request._id is missing", request);
      setError("Invalid request ID. Cannot approve.");
      return;
    }

    if (!mergedHtml.trim()) {
      setError("Merged content is empty. Please accept at least one change.");
      return;
    }

    setError(null);

    try {
      await onApprove(request._id, mergedHtml);
      onApproveSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to approve request");
      onApproveError?.(error);
    }
  };

  /**
   * Reject request with reason
   */
  const handleReject = async () => {
    // FIX: Defensive check to ensure request._id exists before calling API
    if (!isValidRequest) {
      console.error("❌ Cannot reject: request._id is missing", request);
      setError("Invalid request ID. Cannot reject.");
      return;
    }

    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setError(null);

    try {
      await onReject(request._id, rejectionReason);
      onRejectSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to reject request");
      onRejectError?.(error);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // FIX: CRITICAL - Do NOT render conflict UI until data is ready
  // This ensures diff logic runs AFTER data is loaded, not before
  if (!request || !request._id) {
    console.error("[Modal] Request data not ready - no _id");
    return null;
  }

  if (!request.requestedDescription || !request.requestedDescription.trim()) {
    console.error("[Modal] No requested description in request");
    return null;
  }

  if (!request.currentDescriptionSnapshot) {
    console.warn("[Modal] No current description snapshot (might be first version)");
    // This is OK - we can proceed with empty current description
  }

  console.log("[Modal] ✅ Rendering with data ready:", {
    requestId: request._id,
    currentLength: request.currentDescriptionSnapshot?.length || 0,
    requestedLength: request.requestedDescription?.length || 0,
    totalLines: diffLines.length,
    changedLines: diffLines.filter(l => l.type === "added" || l.type === "modified").length,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* FIX: z-[100] ensures modal appears above navbar (must use brackets!) */}
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[95vw] lg:max-w-7xl h-[95vh] rounded-lg bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* FIX: Changed to h-[95vh] (fixed height) and added overflow-hidden
             This ensures modal never grows beyond viewport */}
        {/* ===================================================================
            LOADING OVERLAY
        =================================================================== */}
        {(isApproving || isRejecting) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center backdrop-blur-sm rounded-lg"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-700">
                {isApproving ? "Approving request..." : "Rejecting request..."}
              </p>
            </div>
          </motion.div>
        )}

        {/* ===================================================================
            ERROR BANNER
        =================================================================== */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 sm:px-6 py-3 bg-red-50 border-b overflow-scroll border-red-200 flex items-center gap-2 flex-shrink-0 rounded-t-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* ===================================================================
            HEADER
        =================================================================== */}
        <div className="flex items-start sm:items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0 rounded-t-lg gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-semibold text-gray-800">
              Conflict Resolution
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-xs sm:text-sm text-gray-600">
              <span className="truncate">
                Requested by:{" "}
                <span className="font-medium text-gray-800">{request.requestedByName}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">
                {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
              </span>
              <span className="hidden sm:inline">•</span>
              <span
                className={`font-medium ${
                  request.status === "pending"
                    ? "text-yellow-600"
                    : request.status === "approved"
                    ? "text-green-600"
                    : request.status === "rejected"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                Status: {request.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-purple-100 transition flex-shrink-0"
            disabled={isApproving || isRejecting}
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* ===================================================================
            PROGRAM INFO
        =================================================================== */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b flex-shrink-0">
          <div className="text-xs sm:text-sm">
            <span className="text-gray-600">Program:</span>{" "}
            <span className="font-semibold text-gray-800">{request.programId.title}</span>
          </div>
        </div>

        {/* ===================================================================
            BODY - THREE COLUMN LAYOUT
        =================================================================== */}
        {/* FIX: Changed from overflow-y-auto to overflow-hidden
             This prevents body-level scrolling - each column scrolls independently */}
        <div className="flex-1 overflow-hidden min-h-0">
          {/* Desktop: 3 columns | Tablet: 2 columns | Mobile: 1 column */}
          {/* FIX: Added h-full to ensure grid fills available space */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-300 h-full">
            {/* ===============================================================
                COLUMN 1: EXISTING CHANGES (Current Description Snapshot)
            =============================================================== */}
            {/* FIX: Added h-full to column container */}
            <div className="bg-white flex flex-col h-full">
              {/* FIX: Header is flex-shrink-0 to prevent compression */}
              <div className="flex-shrink-0 bg-red-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <h3 className="font-semibold text-red-800 text-sm">Existing Changes</h3>
              </div>
              {/* FIX: Content area is flex-1 with overflow-y-auto and overflow-x-hidden
                   This creates independent scrolling for this column only */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-8">
                {/* FIX: Use ONLY ql-editor class (removed prose classes that conflict)
                     Added list styling to ensure bullets/numbers appear correctly */}
                <div
                  className="ql-editor [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-2 break-words overflow-wrap-anywhere"
                  dangerouslySetInnerHTML={{
                    __html:
                      request.currentDescriptionSnapshot ||
                      '<p class="text-gray-400 italic">No current description</p>',
                  }}
                />
              </div>
            </div>

            {/* ===============================================================
                COLUMN 2: FINAL CHANGES (Merged Result)
            =============================================================== */}
            {/* FIX: Added h-full to column container */}
            <div className="bg-white flex flex-col h-full border-l-4 border-blue-500">
              {/* FIX: Header is flex-shrink-0 to prevent compression */}
              <div className="flex-shrink-0 bg-blue-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-semibold text-blue-800 text-sm">Final Changes</h3>
                <span className="ml-auto text-xs text-blue-600 font-medium">
                  {Object.keys(acceptedChanges).length} change(s) accepted
                </span>
              </div>
              {/* FIX: Content area is flex-1 with overflow-y-auto and overflow-x-hidden
                   This creates independent scrolling for this column only */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-blue-50/30 p-4 pb-8">
                {mergedHtml.trim() ? (
                  /* FIX: Use ONLY ql-editor class (removed prose classes that conflict)
                     Added list styling to ensure bullets/numbers appear correctly */
                  <div
                    className="ql-editor [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-2 break-words overflow-wrap-anywhere"
                    dangerouslySetInnerHTML={{ __html: mergedHtml }}
                  />
                ) : (
                  <div className="text-center text-gray-400 italic py-8">
                    Accept changes from "Latest Changes" to build the final merged content
                  </div>
                )}
              </div>
            </div>

            {/* ===============================================================
                COLUMN 3: LATEST CHANGES (Requested with Accept Controls)
            =============================================================== */}
            {/* FIX: Added h-full to column container */}
            <div className="bg-white flex flex-col h-full border-l-4 border-green-500 md:col-span-2 lg:col-span-1">
              {/* FIX: Header is flex-shrink-0 to prevent compression */}
              <div className="flex-shrink-0 bg-green-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h3 className="font-semibold text-green-800 text-sm">Line-by-Line Changes</h3>
                <span className="ml-auto text-xs text-green-600 font-medium">
                  {diffLines.filter(l => l.type === "added" || l.type === "modified" || l.type === "removed").length} change(s)
                </span>
                {/* Debug indicator */}
                {diffLines.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    ← Arrow on every change
                  </span>
                )}
              </div>
              {/* FIX: Content area is flex-1 with overflow-y-auto and overflow-x-hidden
                   This creates independent scrolling for this column only */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-green-50/30 p-4 pb-8">
                {/* Line-by-line diff - IntelliJ IDEA style */}
                <h4 className="text-sm font-semibold text-green-800 mb-3">
                  Review Changes Line-by-Line
                </h4>
                <p className="text-xs text-gray-600 mb-4">
                  Click the ← arrow next to each changed line to accept it into Final Changes
                </p>
                <div className="space-y-2">
                  {diffLines.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        No lines to review
                      </p>
                      <p className="text-xs text-yellow-700">
                        The requested description is empty or contains no parseable content.
                      </p>
                    </div>
                  ) : (
                    diffLines.map((line) => {
                      const isAccepted = acceptedChanges[line.id];
                      const isChanged = line.type === "added" || line.type === "modified" || line.type === "removed";

                      // ONLY show changed lines (hide unchanged lines for cleaner UI)
                      if (!isChanged) return null;

                      // Determine colors based on type
                      const getBorderColor = () => {
                        if (isAccepted) return "border-green-500";
                        if (line.type === "added") return "border-blue-300 hover:border-blue-500";
                        if (line.type === "modified") return "border-yellow-400 hover:border-yellow-600";
                        if (line.type === "removed") return "border-red-400 hover:border-red-600";
                        return "border-gray-300";
                      };

                      const getBgColor = () => {
                        if (isAccepted) return "bg-green-50";
                        if (line.type === "added") return "bg-blue-50";
                        if (line.type === "modified") return "bg-yellow-50";
                        if (line.type === "removed") return "bg-red-50";
                        return "bg-white";
                      };

                      return (
                        <div
                          key={line.id}
                          className={`rounded-lg border-2 transition-all ${getBgColor()} ${getBorderColor()} shadow-md`}
                        >
                          <div className="p-3 flex items-start gap-3">
                            {/* ARROW BUTTON - Always visible for changed lines */}
                            <div className="flex-shrink-0 pt-1">
                              {!isAccepted ? (
                                <button
                                  onClick={() => {
                                    console.log(`🎯 Accepting ${line.type} line:`, line.id);
                                    handleAcceptChange(line.id);
                                  }}
                                  className={`group relative p-3 rounded-full text-white transition-all hover:scale-110 active:scale-95 shadow-xl border-2 border-white ${
                                    line.type === "added" ? "bg-blue-600 hover:bg-blue-700" :
                                    line.type === "modified" ? "bg-yellow-600 hover:bg-yellow-700" :
                                    "bg-red-600 hover:bg-red-700"
                                  }`}
                                  title={`Click to ${line.type === "removed" ? "confirm removal" : "accept this change"}`}
                                  disabled={!isPending}
                                  aria-label={`Accept ${line.type}`}
                                >
                                  <ArrowLeft
                                    size={20}
                                    className="transition-transform group-hover:-translate-x-1"
                                    strokeWidth={3}
                                  />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    console.log("🗑️ Discarding line:", line.id);
                                    handleDiscardChange(line.id);
                                  }}
                                  className="p-2.5 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-all hover:scale-110 active:scale-95 shadow-xl border-2 border-white"
                                  title="Click to undo this change"
                                  disabled={!isPending}
                                  aria-label="Discard change"
                                >
                                  <X size={16} strokeWidth={3} />
                                </button>
                              )}
                            </div>

                            {/* Line Content */}
                            <div className="flex-1 min-w-0">
                              {/* Status Badge */}
                              <div className="mb-2">
                                {!isAccepted ? (
                                  <>
                                    {line.type === "added" && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                        NEW - Click ← to add
                                      </span>
                                    )}
                                    {line.type === "modified" && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                                        <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
                                        MODIFIED - Click ← to replace
                                      </span>
                                    )}
                                    {line.type === "removed" && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                        REMOVED - Click ← to delete
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                                    <CheckCircle size={12} />
                                    ACCEPTED
                                  </span>
                                )}
                              </div>

                              {/* Show OLD content for MODIFIED lines */}
                              {line.type === "modified" && line.currentHtml && !isAccepted && (
                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-xs font-semibold text-red-700 mb-1">Old version (will be replaced):</p>
                                  <div
                                    className="ql-editor text-sm line-through opacity-60 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-1 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-1"
                                    dangerouslySetInnerHTML={{ __html: line.currentHtml }}
                                  />
                                </div>
                              )}

                              {/* NEW content */}
                              {line.type !== "removed" && line.requestedHtml && (
                                <>
                                  {line.type === "modified" && !isAccepted && (
                                    <p className="text-xs font-semibold text-green-700 mb-1">New version:</p>
                                  )}
                                  <div
                                    className="ql-editor [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-2 text-gray-800 break-words overflow-wrap-anywhere"
                                    dangerouslySetInnerHTML={{ __html: line.requestedHtml }}
                                  />
                                </>
                              )}

                              {/* REMOVED content */}
                              {line.type === "removed" && line.currentHtml && (
                                <div
                                  className="ql-editor line-through opacity-70 text-red-700 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-2 break-words overflow-wrap-anywhere"
                                  dangerouslySetInnerHTML={{ __html: line.currentHtml }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            REJECTION FORM
        =================================================================== */}
        {showRejectForm && isPending && (
          <div className="border-t px-4 sm:px-6 py-3 sm:py-4 bg-red-50 flex-shrink-0">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={3}
              placeholder="Explain why this request is being rejected..."
              disabled={isRejecting}
              autoFocus
            />
          </div>
        )}

        {/* ===================================================================
            FOOTER
        =================================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 border-t px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex-shrink-0 rounded-b-lg">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-white transition order-2 sm:order-1"
            disabled={isApproving || isRejecting}
          >
            Close
          </button>

          {isPending && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
              {showRejectForm ? (
                <>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                      setError(null);
                    }}
                    className="rounded-lg border border-gray-300 px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-white transition"
                    disabled={isRejecting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || !rejectionReason.trim() || !isValidRequest}
                    className="rounded-lg px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={isApproving || isRejecting || !isValidRequest}
                    className="rounded-lg px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject Request
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting || !isValidRequest || !mergedHtml.trim()}
                    className="rounded-lg px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={18} />
                    {isApproving ? "Approving..." : "Final Approve"}
                  </button>
                </>
              )}
            </div>
          )}

          {!isPending && (
            <div className="order-1 sm:order-2">
              <div
                className={`text-xs sm:text-sm font-medium px-4 py-2 rounded-lg ${
                  request.status === "approved"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {request.status === "approved" ? (
                  <>
                    Approved by {request.reviewedByName} on{" "}
                    {request.reviewedAt
                      ? format(new Date(request.reviewedAt), "MMM dd, yyyy")
                      : "N/A"}
                  </>
                ) : (
                  <>
                    Rejected by {request.reviewedByName} on{" "}
                    {request.reviewedAt
                      ? format(new Date(request.reviewedAt), "MMM dd, yyyy")
                      : "N/A"}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewRequestModal;
