import { api } from '@/utils/axiosFactory';
import { handleErrorResponse } from '@/utils/helper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import type { CommonApiError } from '@/utils/types/common';
import type {
  SendMessagePayload,
  SendMessageResponse,
  GetMessagesResponse,
  GetThreadResponse,
  GetUnreadCountResponse,
  MarkAsReadResponse,
} from '@/utils/types/message';

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<SendMessageResponse, CommonApiError, SendMessagePayload>({
    mutationKey: ['useSendMessage'],
    mutationFn: async (payload: SendMessagePayload) => {
      try {
        const response = await api.post<SendMessageResponse>('/message/send', payload);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useGetSentMessages'] });
      queryClient.invalidateQueries({ queryKey: ['useGetUnreadCount'] });
    },
  });
};

export const useGetInboxMessages = (page = 1, limit = 20) => {
  return useQuery<GetMessagesResponse, CommonApiError>({
    queryKey: ['useGetInboxMessages', page, limit],
    queryFn: async () => {
      try {
        const response = await api.get<GetMessagesResponse>(
          `/message/inbox?page=${page}&limit=${limit}`
        );
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

export const useGetSentMessages = (page = 1, limit = 20) => {
  return useQuery<GetMessagesResponse, CommonApiError>({
    queryKey: ['useGetSentMessages', page, limit],
    queryFn: async () => {
      try {
        const response = await api.get<GetMessagesResponse>(
          `/message/sent?page=${page}&limit=${limit}`
        );
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

export const useGetThreadMessages = (threadId: string) => {
  return useQuery<GetThreadResponse, CommonApiError>({
    queryKey: ['useGetThreadMessages', threadId],
    queryFn: async () => {
      try {
        const response = await api.get<GetThreadResponse>(`/message/thread/${threadId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    enabled: !!threadId,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkAsReadResponse, CommonApiError, string>({
    mutationKey: ['useMarkAsRead'],
    mutationFn: async (messageId: string) => {
      try {
        const response = await api.patch<MarkAsReadResponse>(`/message/${messageId}/read`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useGetInboxMessages'] });
      queryClient.invalidateQueries({ queryKey: ['useGetUnreadCount'] });
    },
  });
};

export const useGetUnreadCount = () => {
  return useQuery<GetUnreadCountResponse, CommonApiError>({
    queryKey: ['useGetUnreadCount'],
    queryFn: async () => {
      try {
        const response = await api.get<GetUnreadCountResponse>('/message/unread/count');
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });
};
