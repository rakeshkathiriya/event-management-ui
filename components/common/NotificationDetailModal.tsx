"use client";

import { motion } from "framer-motion";
import { X, Mail } from "lucide-react";
import { format } from "date-fns";
import { MessageNotification } from "@/utils/types/notification";
import { useMarkNotificationAsRead } from "@/queries/notification/notification";
import { useEffect } from "react";

interface NotificationDetailModalProps {
  notification: MessageNotification;
  onClose: () => void;
}

/**
 * Modal for displaying message notification details
 *
 * Features:
 * - Auto marks notification as read when opened
 * - Shows sender info, subject, content, timestamp
 * - Framer Motion animations
 * - Notification remains in sidebar after closing
 */
const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
}) => {
  const markAsReadMutation = useMarkNotificationAsRead();

  // Mark as read when modal opens
  useEffect(() => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({
        notificationId: notification.id,
        referenceId: notification.messageId,
        notificationType: 'message',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 truncate">Message</h2>
              <p className="text-xs text-gray-500 truncate">
                From {notification.senderName} ({notification.senderRole})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-blue-100 transition flex-shrink-0 ml-4"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Subject */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-900">
            {notification.subject}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Received {format(new Date(notification.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-96 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {notification.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotificationDetailModal;
