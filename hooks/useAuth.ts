"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getUserRole } from "@/utils/helper";

export type UserRole = "Admin" | "User" | null;

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const token = getToken();
    const role = getUserRole();

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setUserRole(role as UserRole);
    setIsLoading(false);
  }, [router]);

  const isAdmin = userRole === "Admin";
  const isUser = userRole === "User";

  return {
    isLoading,
    userRole,
    isAdmin,
    isUser,
    isAuthenticated: !!userRole,
  };
};
