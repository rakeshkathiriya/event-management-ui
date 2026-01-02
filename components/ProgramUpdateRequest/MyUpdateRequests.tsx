"use client";

import { useGetMyUpdateRequests } from "@/queries/programUpdateRequest/programUpdateRequest";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

const MyUpdateRequests = () => {
  const { data: requests, isLoading } = useGetMyUpdateRequests();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={18} className="text-yellow-500" />;
      case "approved":
        return <CheckCircle size={18} className="text-green-500" />;
      case "rejected":
        return <XCircle size={18} className="text-red-500" />;
      case "expired":
        return <AlertCircle size={18} className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#044241]"></div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">You have not submitted any update requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">My Update Requests</h2>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request._id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-800">
                    {typeof request.programId === 'object' ? request.programId.title : 'Unknown Program'}
                  </h3>
                  {getStatusBadge(request.status)}
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Submitted on {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                </p>

                {request.status === "approved" && request.reviewedByName && (
                  <p className="text-sm text-green-700 mb-2">
                    Approved by {request.reviewedByName} on{" "}
                    {format(new Date(request.reviewedAt!), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                )}

                {request.status === "rejected" && (
                  <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-3">
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700 mt-1">
                      {request.rejectionReason || "No reason provided"}
                    </p>
                    {request.reviewedByName && (
                      <p className="text-xs text-red-600 mt-2">
                        Rejected by {request.reviewedByName} on{" "}
                        {format(new Date(request.reviewedAt!), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                    )}
                  </div>
                )}

                {request.status === "expired" && (
                  <p className="text-sm text-gray-600">
                    This request was marked as expired because another request for the same program was approved.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyUpdateRequests;
