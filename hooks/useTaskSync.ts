"use client";

import { useSocket } from "@/app/providers/SocketProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useTaskSync = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Invalidate task board when tasks change
    const invalidateTaskBoard = () => {
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    };

    // Task created
    socket.on("task:created", () => {
      invalidateTaskBoard();
    });

    // Task updated
    socket.on("task:updated", () => {
      invalidateTaskBoard();
    });

    // Task deleted
    socket.on("task:deleted", () => {
      invalidateTaskBoard();
    });

    // Task moved
    socket.on("task:moved", () => {
      invalidateTaskBoard();
    });

    // Tasks reordered
    socket.on("task:reordered", () => {
      invalidateTaskBoard();
    });

    // Cleanup
    return () => {
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("task:moved");
      socket.off("task:reordered");
    };
  }, [socket, isConnected, queryClient]);
};
