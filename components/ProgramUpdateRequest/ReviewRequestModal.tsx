"use client";

import { ProgramUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { applyChanges, computeDiff, Change } from "@/utils/diffMergeEngine";
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// (Removed old extractLines, getTagName, computeLineByLineDiff - replaced with diffMergeEngine)

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
 * - Enhanced diff engine with hasTextLevelChange utility
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

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  // Defensive check - ensure request._id exists before allowing actions
  const isValidRequest = !!request._id;
  const isPending = request.status === "pending";

  // ============================================================================
  // DIFF COMPUTATION (New Block-Based System)
  // ============================================================================

  /**
   * Compute changes between current and requested descriptions
   * Uses new block-based diff engine for accurate change detection
   */
  const changes = useMemo((): Change[] => {
    // Ensure data exists before computing diff
    if (!request._id) {
      console.warn("[DiffCompute] Request not ready yet (no _id)");
      return [];
    }

    if (!request.requestedDescription) {
      console.warn("[DiffCompute] No requested description in request");
      return [];
    }

    console.log("[DiffCompute] Computing for request:", request._id);

    const detectedChanges = computeDiff(
      request.currentDescriptionSnapshot || "",
      request.requestedDescription || ""
    );

    console.log(`[DiffCompute] Result: ${detectedChanges.length} changes detected`);
    return detectedChanges;
  }, [request._id, request.currentDescriptionSnapshot, request.requestedDescription]);

  // ============================================================================
  // MERGED OUTPUT GENERATION (New System)
  // ============================================================================

  /**
   * Generate final merged HTML content using new merge engine
   *
   * Applies accepted changes at correct indexes
   * Handles ADD (insert), MODIFY (replace), REMOVE (delete)
   */
  const mergedHtml = useMemo(() => {
    const acceptedIds = new Set(Object.keys(acceptedChanges));

    if (acceptedIds.size === 0) {
      // No changes accepted, return current as-is
      return request.currentDescriptionSnapshot || "";
    }

    return applyChanges(
      request.currentDescriptionSnapshot || "",
      request.requestedDescription || "",
      acceptedIds
    );
  }, [request.currentDescriptionSnapshot, request.requestedDescription, acceptedChanges]);

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
    // Defensive check to ensure request._id exists before calling API
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
    // Defensive check to ensure request._id exists before calling API
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

  // CRITICAL - Do NOT render conflict UI until data is ready
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
    totalChanges: changes.length,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100  flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[95vw] overflow-x-scroll lg:max-w-7xl h-[95vh] rounded-lg bg-white shadow-2xl flex flex-col overflow-hidden"
      >
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
                <span className="font-medium text-gray-800">
                  {request.requestedByName || "Unknown User"}
                </span>
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
            <span className="font-semibold text-gray-800">
              {request.programId?.title || "Unknown Program"}
            </span>
          </div>
        </div>

        {/* ===================================================================
            BODY - THREE COLUMN LAYOUT
        =================================================================== */}
        <div className="flex-1 overflow-hidden overflow-y-scroll min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-300 h-full">
            {/* ===============================================================
                COLUMN 1: EXISTING CHANGES (Current Description Snapshot)
            =============================================================== */}
            <div className="bg-white flex flex-col h-full">
              <div className="flex-shrink-0 bg-red-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <h3 className="font-semibold text-red-800 text-sm">Existing Changes</h3>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-8">
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
            <div className="bg-white flex flex-col h-full border-l-4 border-blue-500">
              <div className="flex-shrink-0 bg-blue-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-semibold text-blue-800 text-sm">Final Changes</h3>
                <span className="ml-auto text-xs text-blue-600 font-medium">
                  {Object.keys(acceptedChanges).length} change(s) accepted
                </span>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-blue-50/30 p-4 pb-8">
                {mergedHtml.trim() ? (
                  <div
                    className="ql-editor [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mb-2 [&>p]:mb-2 break-words overflow-wrap-anywhere"
                    dangerouslySetInnerHTML={{ __html: mergedHtml }}
                  />
                ) : (
                  <div className="text-center  text-gray-400 italic py-8">
                    Accept changes from Latest Changes to build the final merged content
                  </div>
                )}
              </div>
            </div>

            {/* ===============================================================
                COLUMN 3: LATEST CHANGES (Requested with Accept Controls)
            =============================================================== */}
            <div className="bg-white flex flex-col h-full border-l-4 border-green-500 md:col-span-2 lg:col-span-1">
              <div className="flex-shrink-0 bg-green-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <h3 className="font-semibold text-green-800 text-sm">Line-by-Line Changes</h3>
                <span className="ml-auto text-xs text-green-600 font-medium">
                  {changes.length} change(s)
                </span>
                {changes.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    ← Arrow on every change
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-green-50/30 p-4 pb-8">
                <h4 className="text-sm font-semibold text-green-800 mb-3">
                  Review Changes Line-by-Line
                </h4>
                <p className="text-xs text-gray-600 mb-4">
                  Click the ← arrow next to each changed line to accept it into Final Changes
                </p>
                <div className="space-y-2">
                  {changes.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-yellow-800 mb-2">No changes detected</p>
                      <p className="text-xs text-yellow-700">
                        The requested description is identical to the current version.
                      </p>
                    </div>
                  ) : (
                    changes.map((change) => {
                      const isAccepted = acceptedChanges[change.id];

                      // Determine colors based on type
                      const getBorderColor = () => {
                        if (isAccepted) return "border-green-500";
                        if (change.type === "added") return "border-blue-300 hover:border-blue-500";
                        if (change.type === "modified")
                          return "border-yellow-400 hover:border-yellow-600";
                        if (change.type === "removed") return "border-red-400 hover:border-red-600";
                        return "border-gray-300";
                      };

                      const getBgColor = () => {
                        if (isAccepted) return "bg-green-50";
                        if (change.type === "added") return "bg-blue-50";
                        if (change.type === "modified") return "bg-yellow-50";
                        if (change.type === "removed") return "bg-red-50";
                        return "bg-white";
                      };

                      return (
                        <div
                          key={change.id}
                          className={`rounded-lg border-2 transition-all ${getBgColor()} ${getBorderColor()} shadow-md`}
                        >
                          <div className="p-3 flex items-start gap-3">
                            {/* ARROW BUTTON - Always visible for changed lines */}
                            <div className="flex-shrink-0 pt-1">
                              {!isAccepted ? (
                                <button
                                  onClick={() => {
                                    console.log(`🎯 Accepting ${change.type} change:`, change.id);
                                    handleAcceptChange(change.id);
                                  }}
                                  className={`group relative p-3 rounded-full text-white transition-all hover:scale-110 active:scale-95 shadow-xl border-2 border-white ${
                                    change.type === "added"
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : change.type === "modified"
                                      ? "bg-yellow-600 hover:bg-yellow-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }`}
                                  title={`Click to ${
                                    change.type === "removed"
                                      ? "confirm removal"
                                      : "accept this change"
                                  }`}
                                  disabled={!isPending}
                                  aria-label={`Accept ${change.type}`}
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
                                    console.log("🗑️ Discarding change:", change.id);
                                    handleDiscardChange(change.id);
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

                            {/* Change Content */}
                            <div className="flex-1 min-w-0">
                              {/* Status Badge */}
                              <div className="mb-2">
                                {!isAccepted ? (
                                  <>
                                    {change.type === "added" && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                        NEW - Click ← to add
                                      </span>
                                    )}
                                    {change.type === "modified" && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                                        <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
                                        MODIFIED - Click ← to replace
                                      </span>
                                    )}
                                    {change.type === "removed" && (
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

                              {/* Show OLD content for MODIFIED changes */}
                              {change.type === "modified" && change.originalBlock && !isAccepted && (
                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-xs font-semibold text-red-700 mb-1">
                                    Old version (will be replaced):
                                  </p>
                                  <div
                                    className="ql-editor text-sm line-through opacity-60 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-1 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-1"
                                    dangerouslySetInnerHTML={{ __html: change.originalBlock.html }}
                                  />
                                </div>
                              )}

                              {/* NEW content */}
                              {change.type !== "removed" && change.incomingBlock && (
                                <>
                                  {change.type === "modified" && !isAccepted && (
                                    <p className="text-xs font-semibold text-green-700 mb-1">
                                      New version:
                                    </p>
                                  )}
                                  <div
                                    className="ql-editor [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-2 text-gray-800 break-words overflow-wrap-anywhere"
                                    dangerouslySetInnerHTML={{ __html: change.incomingBlock.html }}
                                  />
                                </>
                              )}

                              {/* REMOVED content */}
                              {change.type === "removed" && change.originalBlock && (
                                <div
                                  className="ql-editor line-through opacity-70 text-red-700 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-1 [&>p]:mb-2 break-words overflow-wrap-anywhere"
                                  dangerouslySetInnerHTML={{ __html: change.originalBlock.html }}
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
                    Approved by {request.reviewedByName || "Unknown"} on{" "}
                    {request.reviewedAt
                      ? format(new Date(request.reviewedAt), "MMM dd, yyyy")
                      : "N/A"}
                  </>
                ) : (
                  <>
                    Rejected by {request.reviewedByName || "Unknown"} on{" "}
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
