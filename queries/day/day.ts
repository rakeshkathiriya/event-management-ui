import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import type { CommonApiError, CommonNullResponse } from "@/utils/types/common";
import type { AddProgramToDayParams, ReorderProgramsInDayParams } from "@/utils/types/day";

export const useAddProgramToDay = () => {
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
  });
};

export const useReorderProgramsInDay = () => {
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
  });
};
