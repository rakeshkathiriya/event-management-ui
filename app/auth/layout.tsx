"use client";

import { getToken } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/");
    }
  }, [router]);

  return <>{children}</>;
}
