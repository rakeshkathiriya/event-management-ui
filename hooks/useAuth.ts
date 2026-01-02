"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getUserRole, getUserFromToken } from "@/utils/helper";

export type UserRole = "Admin" | "User" | null;

interface User {
  _id: string;
  role: string;
  name: string;
}

interface AuthState {
  isLoading: boolean;
  userRole: UserRole;
  user: User | null;
}

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    userRole: null,
    user: null,
  });

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const role = getUserRole();
    const userData = getUserFromToken();

    // Batch state updates to avoid cascading renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthState({
      userRole: role as UserRole,
      user: userData,
      isLoading: false,
    });
  }, [router]);

  const isAdmin = authState.userRole === "Admin";
  const isUser = authState.userRole === "User";

  return {
    isLoading: authState.isLoading,
    userRole: authState.userRole,
    isAdmin,
    isUser,
    isAuthenticated: !!authState.userRole,
    user: authState.user,
  };
};
