import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Types
export interface ProgramUpdateRequest {
  _id: string;
  programId: {
    _id: string;
    title: string;
    description: string;
  };
  requestedBy: {
    _id: string;
    name: string;
    role: string;
  };
  requestedByName: string;
  currentDescriptionSnapshot: string;
  requestedDescription: string;
  finalMergedContent?: string; // Admin's final merged/edited content (optional - only set when approved)
  status: "pending" | "approved" | "rejected" | "expired";
  reviewedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitUpdateRequestPayload {
  programId: string;
  requestedDescription: string;
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
  data: ProgramUpdateRequest;
}

export interface UpdateRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
}

/**
 * Submit a new program description update request (USER)
 */
export const useSubmitUpdateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<ApproveRejectResponse, Error, SubmitUpdateRequestPayload>({
    mutationKey: ["submitUpdateRequest"],
    mutationFn: async (payload: SubmitUpdateRequestPayload) => {
      try {
        const response = await api.post<ApproveRejectResponse>(
          "/program-update-request/submit",
          payload
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate user's own requests
      queryClient.invalidateQueries({ queryKey: ["myUpdateRequests"] });
    },
  });
};

/**
 * Get user's own update requests (USER)
 */
export const useGetMyUpdateRequests = () => {
  return useQuery<ProgramUpdateRequest[]>({
    queryKey: ["myUpdateRequests"],
    queryFn: async () => {
      const res = await api.get("/program-update-request/my-requests");
      return res.data.data;
    },
  });
};

/**
 * Get all update requests with optional status filter (ADMIN)
 */
export const useGetAllUpdateRequests = (status?: string) => {
  return useQuery<ProgramUpdateRequest[]>({
    queryKey: ["allUpdateRequests", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await api.get(`/program-update-request/all${params}`);
      return res.data.data;
    },
  });
};

/**
 * Get update requests for a specific program (ADMIN)
 */
export const useGetRequestsByProgram = (programId: string) => {
  return useQuery<ProgramUpdateRequest[]>({
    queryKey: ["programUpdateRequests", programId],
    enabled: !!programId,
    queryFn: async () => {
      const res = await api.get(`/program-update-request/program/${programId}`);
      return res.data.data;
    },
  });
};

/**
 * Get a single update request by ID
 */
export const useGetUpdateRequestById = (requestId: string) => {
  return useQuery<ProgramUpdateRequest>({
    queryKey: ["updateRequest", requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const res = await api.get(`/program-update-request/${requestId}`);
      return res.data.data;
    },
  });
};

/**
 * Approve an update request (ADMIN)
 */
export const useApproveUpdateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApproveRejectResponse,
    Error,
    { requestId: string; finalMergedContent: string }
  >({
    mutationKey: ["approveUpdateRequest"],
    mutationFn: async ({ requestId, finalMergedContent }) => {
      try {
        const response = await api.patch<ApproveRejectResponse>(
          `/program-update-request/${requestId}/approve`,
          { finalMergedContent }
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["allUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["programUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["updateRequestStats"] });
      queryClient.invalidateQueries({ queryKey: ["getAllPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["getProgramById"] });
    },
  });
};

/**
 * Reject an update request (ADMIN)
 */
export const useRejectUpdateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApproveRejectResponse,
    Error,
    { requestId: string; rejectionReason?: string }
  >({
    mutationKey: ["rejectUpdateRequest"],
    mutationFn: async ({ requestId, rejectionReason }) => {
      try {
        const response = await api.patch<ApproveRejectResponse>(
          `/program-update-request/${requestId}/reject`,
          { rejectionReason }
        );
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["allUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["programUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["updateRequestStats"] });
    },
  });
};

/**
 * Get update request statistics (ADMIN)
 */
export const useGetUpdateRequestStats = () => {
  return useQuery<UpdateRequestStats>({
    queryKey: ["updateRequestStats"],
    queryFn: async () => {
      const res = await api.get("/program-update-request/stats");
      return res.data.data;
    },
  });
};
