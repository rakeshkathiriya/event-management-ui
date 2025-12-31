import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import type { CommonApiError, CommonNullResponse } from "@/utils/types/common";
import type { AddProgramToDayParams, ReorderProgramsInDayParams } from "@/utils/types/day";

export const useAddProgramToDay = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, AddProgramToDayParams>({
    mutationKey: ["useAddProgramToDay"],
    mutationFn: async ({ dayId, payload }: AddProgramToDayParams) => {
      try {
        const response = await api.post<CommonNullResponse>(`/day/${dayId}`, payload);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all event queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["getAllEvents"] });
      queryClient.invalidateQueries({ queryKey: ["getNearestEvent"] });
    },
  });
};

export const useReorderProgramsInDay = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, ReorderProgramsInDayParams>({
    mutationKey: ["useReorderProgramsInDay"],
    mutationFn: async ({ dayId, payload }: ReorderProgramsInDayParams) => {
      try {
        const response = await api.patch<CommonNullResponse>(`/day/${dayId}/reorder`, payload);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all event queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["getAllEvents"] });
      queryClient.invalidateQueries({ queryKey: ["getNearestEvent"] });
    },
  });
};

export const useRemoveProgramFromDay = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, { dayId: string; programId: string }>({
    mutationKey: ["useRemoveProgramFromDay"],
    mutationFn: async ({ dayId, programId }) => {
      try {
        const response = await api.delete<CommonNullResponse>(`/day/${dayId}/program/${programId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all event queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["getAllEvents"] });
      queryClient.invalidateQueries({ queryKey: ["getNearestEvent"] });
    },
  });
};
