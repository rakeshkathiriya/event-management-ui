"use client";

import {
  useGetUpdateRequestById,
  useApproveUpdateRequest,
  useRejectUpdateRequest,
} from "@/queries/programUpdateRequest/programUpdateRequest";
import ReviewRequestModal from "./ReviewRequestModal";
import { useProgramUpdateNotifications } from "@/hooks/useProgramUpdateNotifications";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface ReviewRequestModalWrapperProps {
  requestId: string;
  onClose: () => void;
}

/**
 * Wrapper component for ReviewRequestModal
 *
 * Responsibilities:
 * - Fetches request data via useGetUpdateRequestById
 * - Handles approve/reject mutations
 * - Passes data and handlers to ReviewRequestModal
 * - Notification updates automatically to show approval (green tick) or rejection (red cross)
 */
const ReviewRequestModalWrapper: React.FC<ReviewRequestModalWrapperProps> = ({
  requestId,
  onClose,
}) => {
  const { data: request, isLoading, error } = useGetUpdateRequestById(requestId);
  const approveMutation = useApproveUpdateRequest();
  const rejectMutation = useRejectUpdateRequest();
  const { updateNotificationToReviewed } = useProgramUpdateNotifications();
  const { user } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="flex flex-col items-center gap-3 bg-white px-8 py-6 rounded-lg shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-700">Loading request...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !request) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white px-8 py-6 rounded-lg shadow-2xl max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Request</h3>
          <p className="text-sm text-gray-700 mb-4">
            {error instanceof Error ? error.message : 'Failed to load update request'}
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2 bg-gray-200 hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Handle approve action
  const handleApprove = async (reqId: string) => {
    try {
      await approveMutation.mutateAsync(reqId);
    } catch (error: any) {
      // Error will be handled in onApproveSuccess/onApproveError callbacks
      throw error;
    }
  };

  // Handle reject action
  const handleReject = async (reqId: string, reason?: string) => {
    try {
      await rejectMutation.mutateAsync({
        requestId: reqId,
        rejectionReason: reason,
      });
    } catch (error: any) {
      // Error will be handled in onRejectSuccess/onRejectError callbacks
      throw error;
    }
  };

  // Success callback for approval
  const handleApproveSuccess = () => {
    // Manually update notification to show green tick for admin
    const reviewedBy = user?.name || 'Admin';
    updateNotificationToReviewed(requestId, 'approved', reviewedBy);
    toast.success('Request approved successfully');
    onClose();
  };

  // Error callback for approval
  const handleApproveError = (error: any) => {
    console.error('Approval error:', error);
    if (error.response?.status === 409) {
      // Conflict: Already reviewed by another admin
      toast.error('This request has already been reviewed by another admin');
      onClose();
    } else {
      toast.error('Failed to approve request. Please try again.');
    }
  };

  // Success callback for rejection
  const handleRejectSuccess = () => {
    // Manually update notification to show red cross for admin
    const reviewedBy = user?.name || 'Admin';
    // Get rejection reason from the request data (it should be updated after mutation)
    updateNotificationToReviewed(requestId, 'rejected', reviewedBy);
    toast.success('Request rejected successfully');
    onClose();
  };

  // Error callback for rejection
  const handleRejectError = (error: any) => {
    console.error('Rejection error:', error);
    toast.error('Failed to reject request. Please try again.');
  };

  return (
    <ReviewRequestModal
      request={request}
      onClose={onClose}
      onApprove={handleApprove}
      onReject={handleReject}
      isApproving={approveMutation.isPending}
      isRejecting={rejectMutation.isPending}
      onApproveSuccess={handleApproveSuccess}
      onApproveError={handleApproveError}
      onRejectSuccess={handleRejectSuccess}
      onRejectError={handleRejectError}
    />
  );
};

export default ReviewRequestModalWrapper;
