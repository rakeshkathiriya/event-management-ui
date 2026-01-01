"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getUserRole, getUserFromToken } from "@/utils/helper";

export type UserRole = "Admin" | "User" | null;

interface User {
  _id: string;
  role: string;
}

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    const role = getUserRole();
    const userData = getUserFromToken();

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setUserRole(role as UserRole);
    setUser(userData);
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
    user,
  };
};
