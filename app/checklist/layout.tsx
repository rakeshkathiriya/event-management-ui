"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProgramUpdateNotifications } from "@/hooks/useProgramUpdateNotifications";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  // Initialize real-time notifications for program update requests
  useProgramUpdateNotifications();

  // Show nothing while checking auth - prevents UI flicker
  if (isLoading) {
    return (
      <div className="flex h-screen items-center  justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-br from-bgSoft/50 to-white border-2">
      <div className="p-0 bg-gradient-to-br from-bgSoft/50 to-white">
        {children}
      </div>
    </div>
  );
}
