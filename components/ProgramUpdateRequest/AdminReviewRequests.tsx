"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import {
  useGetAllUpdateRequests,
  useApproveUpdateRequest,
  useRejectUpdateRequest,
} from "@/queries/programUpdateRequest/programUpdateRequest";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import ReviewRequestModal from "./ReviewRequestModal";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "expired";

const AdminReviewRequests = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data: requests, isLoading } = useGetAllUpdateRequests(
    statusFilter === "all" ? undefined : statusFilter
  );
  const { mutate: approveRequest, isPending: isApproving } = useApproveUpdateRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectUpdateRequest();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "approved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "rejected":
        return <XCircle size={16} className="text-red-500" />;
      case "expired":
        return <AlertCircle size={16} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";

    switch (status) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            {getStatusIcon(status)}
            Pending
          </span>
        );
      case "approved":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            {getStatusIcon(status)}
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            {getStatusIcon(status)}
            Rejected
          </span>
        );
      case "expired":
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {getStatusIcon(status)}
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const handleApprove = (requestId: string) => {
    approveRequest(requestId, {
      onSuccess: () => {
        setSelectedRequestId(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to approve request");
      },
    });
  };

  const handleReject = (requestId: string, reason?: string) => {
    rejectRequest(
      { requestId, rejectionReason: reason },
      {
        onSuccess: () => {
          setSelectedRequestId(null);
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to reject request");
        },
      }
    );
  };

  const selectedRequest = requests?.find((r) => r._id === selectedRequestId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#044241]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Program Update Requests</h2>

        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected", "expired"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-[#044241] text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {!requests || requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">
            No {statusFilter !== "all" ? statusFilter : ""} update requests found.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {typeof request.programId === 'object' ? request.programId.title : 'Unknown Program'}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>
                      Requested by:{" "}
                      <span className="font-medium text-gray-800">
                        {request.requestedByName}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                    </span>
                  </div>

                  {request.status !== "pending" && request.reviewedByName && (
                    <p className="text-sm text-gray-600 mb-2">
                      Reviewed by <span className="font-medium">{request.reviewedByName}</span> on{" "}
                      {format(new Date(request.reviewedAt!), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  )}

                  {request.status === "rejected" && request.rejectionReason && (
                    <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-3">
                      <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedRequestId(request._id)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Review
                  </button>

                  {request.status === "pending" && (
                    <button
                      onClick={() => setSelectedRequestId(request._id)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                      Review & Decide
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <ReviewRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequestId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      )}
    </div>
  );
};

export default AdminReviewRequests;
