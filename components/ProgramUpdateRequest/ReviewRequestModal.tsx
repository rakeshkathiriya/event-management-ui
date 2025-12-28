"use client";

import { ProgramUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { getChangeIndicator, highlightChanges, showDeletions } from "@/utils/diffHighlight";
import { format } from "date-fns";
import { CheckCircle, X, XCircle } from "lucide-react";
import { useState } from "react";

interface ReviewRequestModalProps {
  request: ProgramUpdateRequest;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
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
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onReject(request._id, rejectionReason);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-7xl rounded-lg bg-white shadow-2xl my-8 flex flex-col"
        style={{ maxHeight: "calc(100vh - 4rem)" }}
      >
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
                    onClick={() => onApprove(request._id)}
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
      </div>
    </div>
  );
};

export default ReviewRequestModal;
