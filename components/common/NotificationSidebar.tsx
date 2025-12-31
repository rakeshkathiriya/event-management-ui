"use client";

import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useProgramUpdateNotifications } from "@/hooks/useProgramUpdateNotifications";
import { motion, PanInfo } from "framer-motion";
import { useState } from "react";
import ReviewRequestModalWrapper from "../ProgramUpdateRequest/ReviewRequestModalWrapper";
import NotificationDetailModal from "./NotificationDetailModal";

export default function NotificationSidebar() {
  const {
    notifications: messageNotifications,
    removeNotification: removeMessageNotification,
    clearAllNotifications: clearMessageNotifications,
    notificationCount: messageCount,
  } = useMessageNotifications();

  const {
    notifications: programNotifications,
    removeNotification: removeProgramNotification,
    clearAllNotifications: clearProgramNotifications,
    notificationCount: programCount,
  } = useProgramUpdateNotifications();

  const totalCount = messageCount + programCount;

  // State for modal management
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"message" | "review-request" | null>(null);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Click handler to open modals
  const handleNotificationClick = (notification: any, type: "message" | "program") => {
    if (type === "message") {
      setSelectedNotification(notification);
      setModalType("message");
    } else if (notification.type === "new-request") {
      // Only open modal for new requests, not for reviewed notifications
      // VALIDATION: Ensure requestId exists before opening modal
      // This prevents "Cast to ObjectId failed" error in backend
      if (!notification.requestId || notification.requestId === "undefined") {
        console.error("❌ Cannot open review modal: requestId is missing or invalid", notification);
        return;
      }
      setSelectedNotification(notification);
      setModalType("review-request");
    }
    // Don't open modal for reviewed notifications (they're informational only)
  };

  // Dismiss handler - removes from UI only (not from database)
  const handleDismiss = (
    notification: any,
    type: "message" | "program",
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent click-to-open

    // Remove from UI only - no backend call
    if (type === "message") {
      removeMessageNotification(notification.id);
    } else {
      removeProgramNotification(notification.id);
    }
  };

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white shadow-lg border-l border-gray-200 z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-lg">
          Notifications {totalCount > 0 && `(${totalCount})`}
        </h3>
        {totalCount > 0 && (
          <button
            onClick={() => {
              clearMessageNotifications();
              clearProgramNotifications();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm font-medium">No new notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Program Update Notifications */}
            {programNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                dragElastic={0.2}
                onDragEnd={(e, info: PanInfo) => {
                  if (info.offset.x > 80) {
                    handleDismiss(notification, "program", e as any);
                  }
                }}
                whileDrag={{ backgroundColor: "#fee2e2", scale: 0.98 }}
                className="p-4 hover:bg-gray-50 relative group transition-colors cursor-pointer"
                onClick={() => handleNotificationClick(notification, "program")}
              >
                <button
                  onClick={(e) => handleDismiss(notification, "program", e)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="block pr-6">
                  <div className="flex items-start mb-2">
                    <div className="flex-shrink-0 mr-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === "new-request"
                            ? "bg-blue-100"
                            : notification.status === "approved"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        <span className="text-lg">
                          {notification.type === "new-request"
                            ? "📝"
                            : notification.status === "approved"
                            ? "✅"
                            : "❌"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {notification.message}
                      </p>
                      {notification.rejectionReason && (
                        <p className="text-xs text-red-600 mb-1">
                          Reason: {notification.rejectionReason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Message Notifications */}
            {messageNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                dragElastic={0.2}
                onDragEnd={(e, info: PanInfo) => {
                  if (info.offset.x > 60) {
                    handleDismiss(notification, "message", e as any);
                  }
                }}
                whileDrag={{ backgroundColor: "#fee2e2", scale: 0.98 }}
                className="p-4 hover:bg-gray-50 relative group transition-colors cursor-pointer"
                onClick={() => handleNotificationClick(notification, "message")}
              >
                <button
                  onClick={(e) => handleDismiss(notification, "message", e)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="block pr-6">
                  <div className="flex items-start mb-2">
                    <div className="shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {notification.senderName}
                        <span className="ml-1 text-xs font-normal text-gray-500">
                          ({notification.senderRole})
                        </span>
                      </p>
                      {/* <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                        {notification.subject}
                      </p> */}
                      <p className=" text-gray-600 text-md line-clamp-2">{notification.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-center text-xs text-gray-500">Real-time notifications</p>
      </div>

      {/* Modals */}
      {modalType === "message" && selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => {
            setModalType(null);
            setSelectedNotification(null);
          }}
        />
      )}

      {/* CORRECT IMPLEMENTATION: Uses ReviewRequestModalWrapper as single entry point
          Passes only requestId - the wrapper handles data fetching and validation */}
      {modalType === "review-request" && selectedNotification && (
        <ReviewRequestModalWrapper
          requestId={selectedNotification.requestId}
          onClose={() => {
            setModalType(null);
            setSelectedNotification(null);
          }}
        />
      )}
    </aside>
  );
}
