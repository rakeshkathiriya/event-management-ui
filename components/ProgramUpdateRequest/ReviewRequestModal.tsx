"use client";

import { X, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { ProgramUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { format } from "date-fns";

interface ReviewRequestModalProps {
  request: ProgramUpdateRequest;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-7xl rounded-lg bg-white shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Review Update Request
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Program: {typeof request.programId === 'object' ? request.programId.title : 'Unknown Program'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-200 transition"
            disabled={isApproving || isRejecting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Request Info */}
        <div className="border-b px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              Requested by:{" "}
              <span className="font-medium text-gray-800">{request.requestedByName}</span>
            </span>
            <span>•</span>
            <span>
              {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
            </span>
            <span>•</span>
            <span>
              Status:{" "}
              <span className={`font-medium ${
                request.status === "pending" ? "text-yellow-600" :
                request.status === "approved" ? "text-green-600" :
                request.status === "rejected" ? "text-red-600" :
                "text-gray-600"
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </span>
          </div>
        </div>

        {/* Side-by-side Comparison */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 h-full">
            {/* Current Description */}
            <div className="border-r overflow-y-auto">
              <div className="sticky top-0 bg-gray-100 border-b px-6 py-3">
                <h3 className="font-semibold text-gray-800">Current Description</h3>
              </div>
              <div className="px-6 py-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: request.currentDescriptionSnapshot || "<p class='text-gray-400 italic'>No description</p>",
                  }}
                />
              </div>
            </div>

            {/* Requested Description */}
            <div className="overflow-y-auto">
              <div className="sticky top-0 bg-green-50 border-b border-green-200 px-6 py-3">
                <h3 className="font-semibold text-green-800">Requested Description</h3>
              </div>
              <div className="px-6 py-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: request.requestedDescription || "<p class='text-gray-400 italic'>No description</p>",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Form (if showing) */}
        {showRejectForm && isPending && (
          <div className="border-t px-6 py-4 bg-red-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Explain why this request is being rejected..."
              disabled={isRejecting}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-white transition"
            disabled={isApproving || isRejecting}
          >
            Close
          </button>

          {isPending && (
            <div className="flex gap-3">
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
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => onApprove(request._id)}
                    disabled={isApproving || isRejecting}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
