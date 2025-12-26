import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { LoginUserResponse, RegisterUserPayload } from "@/utils/types/auth";
import { CommonApiError, CommonNullResponse } from "@/utils/types/common";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useUserRegistration = () => {
  return useMutation<CommonNullResponse, CommonApiError, RegisterUserPayload>({
    mutationKey: ["useUserRegistration"],
    mutationFn: async (payload: RegisterUserPayload) => {
      try {
        const response = await api.post<CommonNullResponse>("/auth/register", payload);
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

export const useUserLogin = () => {
  return useMutation<LoginUserResponse, CommonApiError, { mobile: string; password: string }>({
    mutationKey: ["useUserLogin"],
    mutationFn: async (payload: { mobile: string; password: string }) => {
      try {
        const response = await api.post<LoginUserResponse>("/auth/login", payload);

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

export const useUserLogout = () => {
  return useMutation<CommonNullResponse, CommonApiError, void>({
    mutationKey: ["useUserLogout"],
    mutationFn: async () => {
      try {
        const response = await api.post<CommonNullResponse>("/auth/logout");
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
