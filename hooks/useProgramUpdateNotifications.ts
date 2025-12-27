"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/app/providers/SocketProvider";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

export interface ProgramUpdateNotification {
  id: string;
  requestId: string;
  programId: string;
  requestedBy?: string;
  requestedByRole?: string;
  status?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  message: string;
  createdAt: Date;
  type: "new-request" | "reviewed";
}

export const useProgramUpdateNotifications = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<ProgramUpdateNotification[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new program update requests (ADMIN only)
    if (isAdmin) {
      socket.on("program:update-request", (data: any) => {
        console.log("Received program update request notification:", data);

        const notification: ProgramUpdateNotification = {
          id: data.requestId || Date.now().toString(),
          requestId: data.requestId,
          programId: data.programId,
          requestedBy: data.requestedBy,
          requestedByRole: data.requestedByRole,
          message: data.message,
          createdAt: new Date(data.createdAt || new Date()),
          type: "new-request",
        };

        // Add to notifications list
        setNotifications((prev) => [notification, ...prev]);

        // Show toast notification
        toast(
          `${data.requestedBy} submitted a program description update request`,
          {
            duration: 5000,
            icon: "📝",
          }
        );

        // Invalidate admin queries
        queryClient.invalidateQueries({ queryKey: ["allUpdateRequests"] });
        queryClient.invalidateQueries({ queryKey: ["updateRequestStats"] });
      });
    }

    // Listen for update request review notifications (USER)
    socket.on("program:update-reviewed", (data: any) => {
      console.log("Received program update review notification:", data);

      const notification: ProgramUpdateNotification = {
        id: data.requestId || Date.now().toString(),
        requestId: data.requestId,
        programId: data.programId,
        status: data.status,
        reviewedBy: data.reviewedBy,
        rejectionReason: data.rejectionReason,
        message: data.message,
        createdAt: new Date(data.reviewedAt || new Date()),
        type: "reviewed",
      };

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      if (data.status === "approved") {
        toast.success(
          `Your program description update request was approved by ${data.reviewedBy}`,
          {
            duration: 5000,
          }
        );
      } else if (data.status === "rejected") {
        toast.error(
          `Your program description update request was rejected by ${data.reviewedBy}`,
          {
            duration: 5000,
          }
        );
      }

      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ["myUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["getProgramById"] });
      queryClient.invalidateQueries({ queryKey: ["getAllPrograms"] });
    });

    // Listen for program updates (ALL USERS - for real-time sync)
    socket.on("program:updated", (data: any) => {
      console.log("📢 Program updated:", data);

      // Update React Query cache for this specific program
      queryClient.setQueryData(["getProgramById", data.programId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            description: data.description,
          };
        }
        return oldData;
      });

      // Invalidate program lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["getAllPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["getProgramById", data.programId] });

      console.log(`✅ Updated cache for program ${data.programId}`);
    });

    return () => {
      socket.off("program:update-request");
      socket.off("program:update-reviewed");
      socket.off("program:updated");
    };
  }, [socket, isConnected, queryClient, isAdmin]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    removeNotification,
    clearAllNotifications,
    notificationCount: notifications.length,
  };
};
