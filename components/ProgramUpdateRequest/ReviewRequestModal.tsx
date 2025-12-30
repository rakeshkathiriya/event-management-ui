"use client";

import { ProgramUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { getChangeIndicator, highlightChanges, showDeletions } from "@/utils/diffHighlight";
import { format } from "date-fns";
import { CheckCircle, X, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface ReviewRequestModalProps {
  request: ProgramUpdateRequest;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  onApproveSuccess?: () => void;
  onApproveError?: (error: any) => void;
  onRejectSuccess?: () => void;
  onRejectError?: (error: any) => void;
}

/**
 * Admin Review Modal - Side-by-side comparison with diff highlighting
 *
 * Features:
 * - Shows current vs requested descriptions side-by-side
 * - Highlights ONLY changed/added content in light green
 * - Shows deleted content with strikethrough in current description
 * - Fully responsive (stacked on mobile)
 * - Approve/Reject actions with rejection reason
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
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    try {
      await onApprove(request._id);
      onApproveSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
      onApproveError?.(err);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }
    setError(null);
    try {
      await onReject(request._id, rejectionReason);
      onRejectSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
      onRejectError?.(err);
    }
  };

  const isPending = request.status === "pending";

  // Apply smart diff highlighting
  const { highlightedHtml, hasChanges, changeType } = highlightChanges(
    request.currentDescriptionSnapshot || "",
    request.requestedDescription || ""
  );

  // Show deletions in current description
  const currentWithDeletions = showDeletions(
    request.currentDescriptionSnapshot || "",
    request.requestedDescription || ""
  );

  const changeIndicator = getChangeIndicator(changeType);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-7xl rounded-lg bg-white shadow-2xl my-8 flex flex-col"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
      >
        {/* Loading Overlay */}
        {(isApproving || isRejecting) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-700">
                {isApproving ? 'Approving request...' : 'Rejecting request...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 flex-shrink-0"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Header - Fixed */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 truncate">Review Update Request</h2>
            <p className="text-sm text-gray-600 mt-1 truncate">
              Program:{" "}
              {typeof request.programId === "object" ? request.programId.title : "Unknown Program"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-200 transition flex-shrink-0 ml-4"
            disabled={isApproving || isRejecting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Request Info - Fixed */}
        <div className="border-b px-6 py-3 bg-gray-50 flex-shrink-0 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="whitespace-nowrap">
              Requested by:{" "}
              <span className="font-medium text-gray-800">{request.requestedByName}</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">
              {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">
              Status:{" "}
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
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </span>
            {hasChanges && (
              <>
                <span className="hidden sm:inline">•</span>
                <span
                  className="flex items-center gap-1 font-medium whitespace-nowrap"
                  style={{ color: changeIndicator.color }}
                >
                  <span>{changeIndicator.icon}</span>
                  {changeIndicator.message}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Side-by-side Comparison - Scrollable */}
        <div className="flex-1 overflow-scroll min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            {/* Current Description (with deletions highlighted) */}
            <div className="border-b md:border-b-0 md:border-r flex flex-col h-full overflow-hidden">
              <div className="sticky top-0 bg-gray-100 border-b px-6 py-3 z-10 flex-shrink-0">
                <h3 className="font-semibold text-gray-800">Current Description</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Red strikethrough = content removed by user
                </p>
              </div>
              <div className="px-6 py-4 overflow-y-auto overflow-x-hidden flex-1">
                <div
                  className="prose prose-sm max-w-none break-words"
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      currentWithDeletions || "<p class='text-gray-400 italic'>No description</p>",
                  }}
                />
              </div>
            </div>

            {/* Requested Description (with additions highlighted) */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="sticky top-0 bg-green-50 border-b border-green-200 px-6 py-3 z-10 flex-shrink-0">
                <h3 className="font-semibold text-green-800">Requested Description</h3>
                <p className="text-xs text-green-700 mt-1">
                  Green highlight = new or changed content
                </p>
              </div>
              <div className="px-6 py-4 overflow-y-auto overflow-x-hidden flex-1">
                <div
                  className="prose prose-sm max-w-none break-words"
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightedHtml || "<p class='text-gray-400 italic'>No description</p>",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Form (if showing) - Fixed */}
        {showRejectForm && isPending && (
          <div className="border-t px-6 py-4 bg-red-50 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={3}
              placeholder="Explain why this request is being rejected..."
              disabled={isRejecting}
            />
          </div>
        )}

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t px-6 py-4 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-white transition order-2 sm:order-1"
            disabled={isApproving || isRejecting}
          >
            Close
          </button>

          {isPending && (
            <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
              {showRejectForm ? (
                <>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }}
                    className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-white transition"
                    disabled={isRejecting}
                  >
                    Cancel Rejection
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || !rejectionReason.trim()}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={isApproving || isRejecting}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    {isApproving ? "Approving..." : "Approve"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewRequestModal;
