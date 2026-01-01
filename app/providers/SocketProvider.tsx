"use client";

import { getToken } from "@/utils/helper";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnect: () => {},
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenState, setTokenState] = useState<string | null>(null);

  // Check token periodically to detect login/logout
  useEffect(() => {
    const checkToken = () => {
      const currentToken = getToken();
      setTokenState(currentToken);
    };

    // Initial check
    checkToken();

    // Check token every 1 second to detect changes
    const interval = setInterval(checkToken, 1000);

    // Also listen for storage events (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        checkToken();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Socket connection effect - runs when token changes
  useEffect(() => {
    // Cleanup previous socket if it exists
    if (socket) {
      console.log("🔄 Cleaning up previous socket connection");
      socket.removeAllListeners();
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    // If no token, don't connect
    if (!tokenState) {
      console.log("❌ No token found, socket will not connect");
      return;
    }

    console.log("🔌 Token detected, initializing socket connection...");

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    const socketInstance = io(backendUrl, {
      auth: { token: tokenState },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setIsConnected(true);
      toast.success("Connected to real-time messaging");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      toast.success("Reconnected to messaging");
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect to socket server");
      toast.error("Failed to connect to real-time messaging");
    });

    setSocket(socketInstance);

    return () => {
      console.log("🧹 Cleaning up socket on unmount");
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [tokenState]); // Re-run when token changes

  // Manual reconnect function
  const reconnect = () => {
    const currentToken = getToken();
    setTokenState(currentToken);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
