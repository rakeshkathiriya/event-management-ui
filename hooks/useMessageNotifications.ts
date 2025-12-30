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

    console.log('🔔 Setting up message notification listeners');

    // Define handler functions so we can properly remove them later
    const handleNewMessage = (messageData: any) => {
      console.log('✅ Received new message notification:', messageData);

      const notification: MessageNotification = {
        id: messageData.messageId || Date.now().toString(),
        messageId: messageData.messageId,
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
      console.log('✅ Unread count updated:', count);
      queryClient.setQueryData(['useGetUnreadCount'], {
        success: true,
        data: { count },
      });
    };

    // Listen for new messages
    socket.on('message:new', handleNewMessage);
    console.log('✅ Registered "message:new" listener');

    // Listen for unread count updates
    socket.on('unread:count', handleUnreadCount);
    console.log('✅ Registered "unread:count" listener');

    // Cleanup function with specific handler references
    return () => {
      console.log('🧹 Cleaning up message notification listeners');
      socket.off('message:new', handleNewMessage);
      socket.off('unread:count', handleUnreadCount);
    };
  }, [socket, isConnected]);

  return {
    notifications,
    removeNotification,
    clearAllNotifications,
    notificationCount: notifications.length,
  };
};
