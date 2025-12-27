"use client";

import Header from "@/components/common/Header";
import NotificationSidebar from "@/components/common/NotificationSidebar";
import FloatingMessageButton from "@/components/common/FloatingMessageButton";
import { useAuth } from "@/hooks/useAuth";
import { useProgramUpdateNotifications } from "@/hooks/useProgramUpdateNotifications";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  // Initialize real-time notifications for program update requests
  useProgramUpdateNotifications();

  // Show nothing while checking auth - prevents UI flicker
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Header />
      <div className="mr-80 pt-16">
        {children}
      </div>
      <NotificationSidebar />
      <FloatingMessageButton />
    </div>
  );
}
