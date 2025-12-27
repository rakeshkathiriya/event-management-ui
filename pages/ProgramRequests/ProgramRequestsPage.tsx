"use client";

import { useAuth } from "@/hooks/useAuth";
import AdminReviewRequests from "@/components/ProgramUpdateRequest/AdminReviewRequests";
import MyUpdateRequests from "@/components/ProgramUpdateRequest/MyUpdateRequests";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProgramRequestsPage = () => {
  const { isAdmin, isUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin && !isUser) {
      router.push("/auth/login");
    }
  }, [isLoading, isAdmin, isUser, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#044241]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isAdmin ? "Program Update Requests" : "My Update Requests"}
          </h1>
          <p className="mt-2 text-gray-600">
            {isAdmin
              ? "Review and manage program description update requests from users"
              : "Track the status of your program description update requests"}
          </p>
        </div>

        {/* Content */}
        {isAdmin ? <AdminReviewRequests /> : <MyUpdateRequests />}
      </div>
    </div>
  );
};

export default ProgramRequestsPage;
