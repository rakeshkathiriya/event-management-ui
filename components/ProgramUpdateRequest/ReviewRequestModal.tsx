"use client";

import { ProgramUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { format } from "date-fns";
import { CheckCircle, X, XCircle, AlertCircle, Eye, FileEdit } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import 'quill/dist/quill.snow.css';

interface ReviewRequestModalProps {
  request: ProgramUpdateRequest;
  onClose: () => void;
  onApprove: (requestId: string, finalMergedContent: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  onApproveSuccess?: () => void;
  onApproveError?: (error: any) => void;
  onRejectSuccess?: () => void;
  onRejectError?: (error: any) => void;
}

/**
 * Simple Side-by-Side Diff Review Modal
 * - Left: Current Version
 * - Right: Incoming Version
 * - Admin approves or rejects entire change
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

  // Approve - send incoming description as final content
  const handleApprove = async () => {
    // FIX: Defensive check to ensure request._id exists before calling API
    // This prevents "Cast to ObjectId failed for value 'undefined'" error
    if (!request._id) {
      console.error("❌ Cannot approve: request._id is missing", request);
      setError("Invalid request ID. Cannot approve.");
      return;
    }

    try {
      // Use the requested description as the final content
      await onApprove(request._id, request.requestedDescription);
      onApproveSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to approve request");
      onApproveError?.(err);
    }
  };

  // Reject request
  const handleReject = async () => {
    // FIX: Defensive check to ensure request._id exists before calling API
    if (!request._id) {
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
    } catch (err: any) {
      setError(err.message || "Failed to reject request");
      onRejectError?.(err);
    }
  };

  const isPending = request.status === "pending";
  // FIX: Disable approve/reject buttons if request._id is missing
  const isValidRequest = !!request._id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[98vw] lg:max-w-7xl rounded-lg bg-white shadow-2xl my-4 flex flex-col"
        style={{ maxHeight: "95vh" }}
      >
        {/* Loading Overlay */}
        {(isApproving || isRejecting) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center backdrop-blur-sm rounded-lg"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-700">
                {isApproving ? "Approving request..." : "Rejecting request..."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 flex-shrink-0 rounded-t-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0 rounded-t-lg gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-semibold text-gray-800">Review Program Update Request</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-xs sm:text-sm text-gray-600">
              <span className="truncate">
                Requested by: <span className="font-medium text-gray-800">{request.requestedByName}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">{format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
              <span className="hidden sm:inline">•</span>
              <span className={`font-medium ${
                request.status === 'pending' ? 'text-yellow-600' :
                request.status === 'approved' ? 'text-green-600' :
                request.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
              }`}>
                Status: {request.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-blue-100 transition flex-shrink-0"
            disabled={isApproving || isRejecting}
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Program Info */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b flex-shrink-0">
          <div className="text-xs sm:text-sm">
            <span className="text-gray-600">Program:</span>{' '}
            <span className="font-semibold text-gray-800">{request.programId.title}</span>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-300">

            {/* LEFT: Current Version */}
            <div className="bg-white flex flex-col">
              <div className="sticky top-0 bg-gray-100 border-b px-4 py-3 z-10 flex items-center gap-2">
                <Eye size={18} className="text-gray-600 flex-shrink-0" />
                <h3 className="font-semibold text-gray-800 text-sm">Current Description</h3>
              </div>
              <div className="p-4 flex-1">
                <div
                  className="prose prose-sm max-w-none text-gray-700 [&>*]:my-2"
                  dangerouslySetInnerHTML={{ __html: request.currentDescriptionSnapshot || '<p class="text-gray-400 italic">No current description</p>' }}
                />
              </div>
            </div>

            {/* RIGHT: Incoming Version */}
            <div className="bg-white flex flex-col border-l-4 border-green-500">
              <div className="sticky top-0 bg-green-50 border-b px-4 py-3 z-10 flex items-center gap-2">
                <FileEdit size={18} className="text-green-700 flex-shrink-0" />
                <h3 className="font-semibold text-green-800 text-sm">Requested New Description</h3>
              </div>
              <div className="p-4 flex-1 bg-green-50/30">
                <div
                  className="prose prose-sm max-w-none text-gray-700 [&>*]:my-2"
                  dangerouslySetInnerHTML={{ __html: request.requestedDescription || '<p class="text-gray-400 italic">No requested description</p>' }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Rejection Form */}
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

        {/* Footer */}
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
                    disabled={isApproving || isRejecting || !isValidRequest}
                    className="rounded-lg px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={18} />
                    {isApproving ? "Approving..." : "Approve Request"}
                  </button>
                </>
              )}
            </div>
          )}

          {!isPending && (
            <div className="order-1 sm:order-2">
              <div className={`text-xs sm:text-sm font-medium px-4 py-2 rounded-lg ${
                request.status === 'approved'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {request.status === 'approved' ? (
                  <>Approved by {request.reviewedByName} on {request.reviewedAt ? format(new Date(request.reviewedAt), "MMM dd, yyyy") : 'N/A'}</>
                ) : (
                  <>Rejected by {request.reviewedByName} on {request.reviewedAt ? format(new Date(request.reviewedAt), "MMM dd, yyyy") : 'N/A'}</>
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
