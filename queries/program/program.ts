import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { CommonNullResponse } from "@/utils/types/common";
import { CreateProgramPayload } from "@/utils/types/program";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, Error, CreateProgramPayload>({
    mutationKey: ["useCreateProgram"],
    mutationFn: async (payload: CreateProgramPayload) => {
      try {
        const response = await api.post<CommonNullResponse>("/program", payload);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Automatically invalidate and refetch programs list
      queryClient.invalidateQueries({ queryKey: ["getAllPrograms"] });
    },
  });
};

export const useGetProgramById = (programId: string) => {
  return useQuery({
    queryKey: ["getProgramById", programId],
    enabled: !!programId,
    queryFn: async () => {
      const res = await api.get(`/program/${programId}`);
      return res.data.data.program; // ✅ FIXEDAnd
    },
  });
};

export const useGetPrograms = () => {
  return useQuery({
    queryKey: ["getAllPrograms"],
    queryFn: async () => {
      const res = await api.get("/program");
      return res.data.data; // Returns { programs: [], total: number }
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, Error, { id: string } & CreateProgramPayload>({
    mutationKey: ["useUpdateProgram"],
    mutationFn: async ({ id, ...payload }) => {
      try {
        const response = await api.patch<CommonNullResponse>(`/program/${id}`, payload);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllPrograms"] });
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, Error, string>({
    mutationKey: ["useDeleteProgram"],
    mutationFn: async (programId: string) => {
      try {
        const response = await api.delete<CommonNullResponse>(`/program/${programId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getAllPrograms"] });
    },
  });
};
