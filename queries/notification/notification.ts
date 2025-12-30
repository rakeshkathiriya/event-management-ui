import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/axiosFactory';

// --------------------------------------
// Dismiss Notification Mutation
// --------------------------------------

interface DismissNotificationParams {
  notificationId: string;
  referenceId: string;
  notificationType: string;
}

export const useDismissNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['dismissNotification'],
    mutationFn: async ({ notificationId, referenceId, notificationType }: DismissNotificationParams) => {
      const response = await api.patch(`/notification/${notificationId}/dismiss`, {
        referenceId,
        notificationType,
      });
      return response.data;
    },
    onSuccess: () => {
      // Optionally invalidate notification queries if you fetch from backend
      // queryClient.invalidateQueries({ queryKey: ['activeNotifications'] });
    },
    onError: (error) => {
      console.error('Failed to dismiss notification:', error);
    },
  });
};

// --------------------------------------
// Mark Notification as Read Mutation
// --------------------------------------

interface MarkAsReadParams {
  notificationId: string;
  referenceId: string;
  notificationType: string;
}

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['markNotificationAsRead'],
    mutationFn: async ({ notificationId, referenceId, notificationType }: MarkAsReadParams) => {
      const response = await api.patch(`/notification/${notificationId}/read`, {
        referenceId,
        notificationType,
      });
      return response.data;
    },
    onSuccess: () => {
      // Optionally invalidate notification queries
      // queryClient.invalidateQueries({ queryKey: ['activeNotifications'] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
};

// --------------------------------------
// Dismiss All Notifications Mutation
// --------------------------------------

interface DismissAllParams {
  notificationType?: string;
}

export const useDismissAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['dismissAllNotifications'],
    mutationFn: async (params?: DismissAllParams) => {
      const response = await api.post('/notification/dismiss-all', {
        notificationType: params?.notificationType,
      });
      return response.data;
    },
    onSuccess: () => {
      // Optionally invalidate notification queries
      // queryClient.invalidateQueries({ queryKey: ['activeNotifications'] });
    },
    onError: (error) => {
      console.error('Failed to dismiss all notifications:', error);
    },
  });
};

// --------------------------------------
// Get Active Notifications Query (Optional - for backend-fetched notifications)
// --------------------------------------

export const useGetActiveNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['getActiveNotifications'],
    mutationFn: async () => {
      const response = await api.get('/notification/active');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeNotifications'] });
    },
    onError: (error) => {
      console.error('Failed to fetch active notifications:', error);
    },
  });
};
