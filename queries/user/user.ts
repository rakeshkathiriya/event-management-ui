import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { CommonApiError } from "@/utils/types/common";
import { GetUsersResponse, MyAssignmentsResponse } from "@/utils/types/user";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetUsers = () => {
  return useQuery<GetUsersResponse, CommonApiError>({
    queryKey: ["useGetUsers"],
    queryFn: async () => {
      try {
        const response = await api.get<GetUsersResponse>("/user");
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

export const useGetAllUsers = () => {
  return useQuery<GetUsersResponse, CommonApiError>({
    queryKey: ["useGetAllUsers"],
    queryFn: async () => {
      try {
        const response = await api.get<GetUsersResponse>("/user/allUser");
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

// Get logged-in user's own assignments
export const useGetMyAssignments = () => {
  return useQuery<MyAssignmentsResponse, CommonApiError>({
    queryKey: ["useGetMyAssignments"],
    queryFn: async () => {
      try {
        const response = await api.get<MyAssignmentsResponse>("/user/my-assignments");
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
