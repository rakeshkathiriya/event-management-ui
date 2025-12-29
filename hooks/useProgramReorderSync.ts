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
    socket.on("day:programs-reordered", (data: any) => {
      console.log("📢 Programs reordered in real-time:", data);
      console.log(`   Day ID: ${data.dayId}`);
      console.log(`   Reordered by: ${data.reorderedBy}`);
      console.log(`   Programs count: ${data.programIds.length}`);

      // Invalidate the event query to fetch latest order
      queryClient.invalidateQueries({ queryKey: ["getNearestEvent"] });

      console.log(`✅ Event cache invalidated - UI will refresh with new order`);
    });

    return () => {
      socket.off("day:programs-reordered");
    };
  }, [socket, isConnected, queryClient]);
};
