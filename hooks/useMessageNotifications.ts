'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/app/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface MessageNotification {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  subject: string;
  content: string;
  recipientType: string;
  createdAt: Date;
}

interface IncomingMessageData {
  messageId?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  subject: string;
  content: string;
  recipientType: string;
  createdAt?: string | Date;
}

export const useMessageNotifications = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;


    // Define handler functions so we can properly remove them later
    const handleNewMessage = (messageData: IncomingMessageData) => {
      const notification: MessageNotification = {
        id: messageData.messageId || Date.now().toString(),
        messageId: messageData.messageId || Date.now().toString(),
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderRole: messageData.senderRole,
        subject: messageData.subject,
        content: messageData.content,
        recipientType: messageData.recipientType,
        createdAt: new Date(messageData.createdAt || new Date()),
      };

      // Add to notifications list (at the beginning)
      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast.success(`New message from ${messageData.senderName}: ${messageData.subject}`, {
        duration: 4000,
      });

      // Invalidate inbox and unread count queries
      queryClient.invalidateQueries({ queryKey: ['useGetInboxMessages'] });
      queryClient.invalidateQueries({ queryKey: ['useGetUnreadCount'] });
    };

    const handleUnreadCount = ({ count }: { count: number }) => {
      queryClient.setQueryData(['useGetUnreadCount'], {
        success: true,
        data: { count },
      });
    };

    // Listen for new messages
    socket.on('message:new', handleNewMessage);

    // Listen for unread count updates
    socket.on('unread:count', handleUnreadCount);

    // Cleanup function with specific handler references
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('unread:count', handleUnreadCount);
    };
  }, [socket, isConnected, queryClient]);

  return {
    notifications,
    removeNotification,
    clearAllNotifications,
    notificationCount: notifications.length,
  };
};
