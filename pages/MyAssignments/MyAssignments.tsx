"use client";

import { Briefcase, Calendar, Clock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useGetMyAssignments } from "@/queries/user/user";

/* ---------------------------------------
   ✅ SAFE DATE FORMATTER
--------------------------------------- */
const formatDateSafe = (date?: string | Date | null) => {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const MyAssignments = () => {
  const router = useRouter();
  const { isUser, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useGetMyAssignments();

  /* Redirect non-USER role */
  useEffect(() => {
    if (!authLoading && !isUser) {
      router.replace("/main/programs");
    }
  }, [isUser, authLoading, router]);

  /* Loading (auth) */
  if (authLoading || !isUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#044241]" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  /* Loading data */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#044241]" />
          <p className="text-sm text-gray-600">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  /* Error / no assignments */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#044241]">My Assignments</h1>
            <p className="mt-2 text-gray-600">Your event schedule and department assignments</p>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-orange-900">No Assignments Yet</h3>
            <p className="text-orange-700">
              {error.message ||
                "You haven't been assigned to any events. Please contact your administrator."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const events = data?.data?.events || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#044241]">My Assignments</h1>
          <p className="mt-2 text-gray-600">Your event schedule and department assignments</p>
        </div>

        {/* Events */}
        {events.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg text-gray-500">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event) => {
              /* ✅ SAFE EVENT DATE (fallback to first day) */
              const eventDisplayDate =
                formatDateSafe(event.eventStartDate) || formatDateSafe(event.days?.[0]?.date);

              return (
                <div
                  key={event.eventId}
                  className="overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition"
                >
                  {/* Event Header */}
                  <div className="bg-gradient-to-r from-[#044241] to-[#2D6F6D] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                          <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{event.eventTitle}</h2>
                          {event.eventDescription && (
                            <p className="mt-1 text-sm text-white/80">{event.eventDescription}</p>
                          )}
                        </div>
                      </div>

                      {eventDisplayDate && (
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2">
                          <Clock className="h-4 w-4 text-white" />
                          <span className="text-sm font-medium text-white">{eventDisplayDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Days */}
                  <div className="divide-y divide-gray-100">
                    {event.days.map((day) => (
                      <div key={day.dayId} className="p-6 hover:bg-gray-50">
                        <div className="mb-4 flex items-center gap-3 border-l-4 border-[#2D6F6D] pl-4">
                          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#044241] to-[#2D6F6D] text-white">
                            <span className="text-xs">Day</span>
                            <span className="text-xl font-bold">{day.dayNumber}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {day.programs.length} program
                              {day.programs.length !== 1 ? "s" : ""} assigned
                            </p>
                          </div>
                        </div>

                        <div className="ml-4 grid gap-4 pl-14 md:grid-cols-2">
                          {day.programs.map((program, idx) => (
                            <div
                              key={`${program.programId}-${idx}`}
                              className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-[#2D6F6D]"
                            >
                              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#044241] to-[#2D6F6D]" />

                              <div className="relative">
                                <h4 className="mb-3 font-semibold text-gray-900">
                                  {program.programTitle}
                                </h4>

                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-[#2D6F6D]" />
                                  <span className="rounded-full bg-gradient-to-r from-[#044241] to-[#2D6F6D] px-3 py-1 text-xs text-white">
                                    {program.departmentName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssignments;
