import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import type { CommonApiError, CommonNullResponse } from "@/utils/types/common";
import type { CreateEventPayload, GetNearestEventResponse, GetAllEventsResponse } from "@/utils/types/event";

export const useCreateEvent = () => {
  return useMutation<CommonNullResponse, CommonApiError, CreateEventPayload>({
    mutationKey: ["useCreateEvent"],
    mutationFn: async (payload: CreateEventPayload) => {
      try {
        const response = await api.post<CommonNullResponse>("/event", payload);
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

export const useGetNearestEvent = () => {
  return useQuery<GetNearestEventResponse>({
    queryKey: ["getNearestEvent"],
    queryFn: async () => {
      const res = await api.get("/event");
      return res.data;
    },
  });
};

export const useGetAllEvents = () => {
  return useQuery<GetAllEventsResponse>({
    queryKey: ["getAllEvents"],
    queryFn: async () => {
      const res = await api.get("/event/all");
      return res.data;
    },
  });
};

export const useGetEventById = (eventId: string | null) => {
  return useQuery<GetNearestEventResponse>({
    queryKey: ["getEventById", eventId],
    queryFn: async () => {
      const res = await api.get(`/event/${eventId}`);
      return res.data;
    },
    enabled: !!eventId,
  });
};

export const useUpdateEvent = () => {
  return useMutation<CommonNullResponse, CommonApiError, { id: string } & CreateEventPayload>({
    mutationKey: ["useUpdateEvent"],
    mutationFn: async ({ id, ...payload }) => {
      try {
        const response = await api.patch<CommonNullResponse>(`/event/${id}`, payload);
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

export const useDeleteEvent = () => {
  return useMutation<CommonNullResponse, CommonApiError, string>({
    mutationKey: ["useDeleteEvent"],
    mutationFn: async (eventId: string) => {
      try {
        const response = await api.delete<CommonNullResponse>(`/event/${eventId}`);
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
