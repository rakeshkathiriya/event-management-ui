import { api } from "@/utils/axiosFactory"; // your axios instance
import { handleErrorResponse } from "@/utils/helper";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { CommonApiError, CommonNullResponse } from "@/utils/types/common";
import type { CreateDepartmentPayload, GetDepartmentsResponse } from "@/utils/types/department";

export const useCreateDepartment = () => {
  return useMutation<CommonNullResponse, CommonApiError, CreateDepartmentPayload>({
    mutationKey: ["useCreateDepartment"],
    mutationFn: async (payload: CreateDepartmentPayload) => {
      try {
        const response = await api.post<CommonNullResponse>("/department", payload);
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

export const useGetDepartments = () => {
  return useQuery<GetDepartmentsResponse, CommonApiError>({
    queryKey: ["useGetDepartments"],
    queryFn: async () => {
      try {
        const response = await api.get<GetDepartmentsResponse>("/department");
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

export const useUpdateDepartment = () => {
  return useMutation<CommonNullResponse, CommonApiError, { id: string } & CreateDepartmentPayload>({
    mutationKey: ["useUpdateDepartment"],
    mutationFn: async ({ id, ...payload }: { id: string } & CreateDepartmentPayload) => {
      try {
        const response = await api.patch<CommonNullResponse>(`/department/${id}`, payload);
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

export const useDeleteDepartment = () => {
  return useMutation<CommonNullResponse, CommonApiError, string>({
    mutationKey: ["useDeleteDepartment"],
    mutationFn: async (departmentId: string) => {
      try {
        const response = await api.delete<CommonNullResponse>(`/department/${departmentId}`);
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
