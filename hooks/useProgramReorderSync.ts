import { useSocket } from "@/app/providers/SocketProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Custom hook to listen for real-time program reordering events
 * Automatically syncs the event data across all connected clients
 */
export const useProgramReorderSync = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for program reorder events from backend
    socket.on("day:programs-reordered", () => {
      // Invalidate the event query to fetch latest order
      queryClient.invalidateQueries({ queryKey: ["getNearestEvent"] });
    });

    return () => {
      socket.off("day:programs-reordered");
    };
  }, [socket, isConnected, queryClient]);
};
