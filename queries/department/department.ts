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
