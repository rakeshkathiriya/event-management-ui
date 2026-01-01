"use client";

import { useSocket } from "@/app/providers/SocketProvider";
import { useAuth } from "@/hooks/useAuth";
import { useGetUnreadCount } from "@/queries/message/message";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Header = () => {
  const { socket, isConnected } = useSocket();
  const { data: unreadData } = useGetUnreadCount();
  const queryClient = useQueryClient();
  const { isAdmin, isUser, user } = useAuth();
  const unreadCount = unreadData?.data?.count || 0;
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/auth/login");
  };

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for real-time unread count updates
    socket.on("unread:count", ({ count }: { count: number }) => {
      queryClient.setQueryData(["useGetUnreadCount"], {
        success: true,
        data: { count },
      });
    });

    return () => {
      socket.off("unread:count");
    };
  }, [socket, isConnected, queryClient]);

  return (
    <header className="bg-bgPrimary h-16 flex items-center fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-7xl px-6 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-white text-xl font-semibold">Event</h1>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/main/liveEvent" className="text-white text-md hover:opacity-80">
            Live Event
          </Link>

          {/* USER-only navigation */}
          {isUser && (
            <>
              <Link href="/main/my-assignments" className="text-white text-md hover:opacity-80">
                My Assignments
              </Link>
              <Link href="/main/program-requests" className="text-white text-md hover:opacity-80">
                My Requests
              </Link>
            </>
          )}

          {/* Admin-only navigation */}
          {isAdmin && (
            <>
              <Link href="/main/event" className="text-white text-md hover:opacity-80">
                Event
              </Link>
              <Link href="/main/programs" className="text-white text-md hover:opacity-80">
                Programs
              </Link>
              <Link href="/main/department" className="text-white text-md hover:opacity-80">
                Department
              </Link>
              <Link href="/main/user" className="text-white text-md hover:opacity-80">
                User
              </Link>
              <Link href="/main/program-requests" className="text-white text-md hover:opacity-80">
                Update Requests
              </Link>
            </>
          )}

          {/* User Info & Logout */}
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/20">
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">{user.name}</span>
                  <span className="text-white/70 text-xs">{user.role}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-white hover:opacity-80 flex items-center gap-2 transition-opacity"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
