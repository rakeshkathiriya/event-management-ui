"use client";

import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { useAuth } from "@/hooks/useAuth";
import { useRemoveProgramFromDay } from "@/queries/day/day";
import { useDeleteEvent, useGetAllEvents } from "@/queries/event/event";
import CreateEventForm from "./EventForm";
import AddProgramInDay from "./day";

const AllEvent = () => {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();

  // State
  const [showEventModal, setShowEventModal] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(new Set());
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [removingProgramId, setRemovingProgramId] = useState<string | null>(null);

  // Queries
  const { data, isLoading, error, refetch } = useGetAllEvents();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { mutate: removeProgram } = useRemoveProgramFromDay();

  const events = data?.data ?? [];

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/main/home");
    }
  }, [isAdmin, authLoading, router]);

  // Toggle event expansion
  const toggleEvent = (eventId: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Toggle day expansion
  const toggleDay = (dayId: string) => {
    setExpandedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  // Handle event delete
  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId, {
      onSuccess: (data) => {
        if (data.status) {
          toast.success(data.message ?? "Event deleted successfully");
          refetch();
          setDeleteEventId(null);
        } else {
          toast.error(data.message ?? "Failed to delete event");
        }
      },
      onError: (error) => {
        toast.error(error.message ?? "Something went wrong");
      },
    });
  };

  // Handle program remove using dedicated remove endpoint
  const handleRemoveProgram = (dayId: string, programId: string) => {
    // Set the removing state for this specific program
    setRemovingProgramId(programId);

    removeProgram(
      { dayId, programId },
      {
        onSuccess: (data) => {
          setRemovingProgramId(null);
          if (data.status) {
            toast.success(data.message ?? "Program removed successfully");
          } else {
            toast.error(data.message ?? "Failed to remove program");
          }
        },
        onError: (error) => {
          setRemovingProgramId(null);
          toast.error(error.message ?? "Failed to remove program");
        },
      }
    );
  };

  // Show loading while checking permissions
  if (authLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-bgPrimary border-t-transparent mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-bgPrimaryDark to-bgPrimary">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-bgPrimaryDark to-bgPrimary bg-clip-text text-transparent">
                  Event Management
                </h1>
              </div>
              <p className="text-gray-600 ml-16">
                Manage all events, days, and programs in one place
              </p>
            </div>

            <button
              onClick={() => setShowEventModal(true)}
              className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
            >
              <Plus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
              <span>Create Event</span>
            </button>
          </div>

          {/* Stats Summary */}
          {!isLoading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
                <div className="p-2 rounded-lg bg-blue-500">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{events.length}</p>
                  <p className="text-xs text-blue-600 font-medium">Total Events</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50">
                <div className="p-2 rounded-lg bg-purple-500">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {events.reduce((sum, e) => sum + e.days.length, 0)}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">Total Days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50">
                <div className="p-2 rounded-lg bg-green-500">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {events.reduce(
                      (sum, e) => sum + e.days.reduce((daySum, d) => daySum + d.programs.length, 0),
                      0
                    )}
                  </p>
                  <p className="text-xs text-green-600 font-medium">Total Programs</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-bgPrimary border-t-transparent mb-4" />
            <p className="text-gray-600 font-medium">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-3xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-8 text-center shadow-lg">
            <div className="inline-flex p-4 rounded-full bg-red-200 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red-700 font-semibold text-lg mb-2">Failed to load events</p>
            <p className="text-red-600 text-sm">Please try again or contact support</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white p-16 text-center shadow-lg">
            <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
              <Calendar size={64} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Events Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Get started by creating your first event. You can manage days and programs within each
              event.
            </p>
            <button
              onClick={() => setShowEventModal(true)}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
            >
              <Plus size={18} />
              Create Your First Event
            </button>
          </div>
        )}

        {/* Events List */}
        {!isLoading && !error && events.length > 0 && (
          <div className="space-y-5">
            {events.map((event) => (
              <div
                key={event._id}
                className="group rounded-3xl border-2 border-gray-200 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Event Header */}
                <div className="relative bg-gradient-to-r from-bgPrimaryDark via-bgPrimary to-bgPrimaryDark/90 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

                  <div className="relative flex items-center justify-between p-6">
                    <button
                      onClick={() => toggleEvent(event._id)}
                      className="flex items-center gap-4 flex-1 group/header"
                    >
                      <div className="flex-shrink-0 p-3 rounded-2xl bg-white/10 backdrop-blur-sm group-hover/header:bg-white/20 transition-all">
                        {expandedEventIds.has(event._id) ? (
                          <ChevronDown size={24} className="transition-transform" />
                        ) : (
                          <ChevronRight size={24} className="transition-transform" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-2xl font-bold mb-1 group-hover/header:translate-x-1 transition-transform">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm opacity-90">
                          <Calendar size={14} />
                          <span>
                            {new Date(event.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(event.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                            {event.days.length} Day{event.days.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteEventId(event._id);
                        }}
                        className="p-3 rounded-xl bg-white/10 hover:bg-red-500/90 backdrop-blur-sm transition-all hover:scale-110"
                        title="Delete event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event Description */}
                {event.description && expandedEventIds.has(event._id) && (
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                )}

                {/* Days List */}
                {expandedEventIds.has(event._id) && (
                  <div className="p-5 space-y-4 bg-gradient-to-br from-gray-50 to-white">
                    {event.days.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-300 bg-white">
                        <CalendarDays size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">No days in this event</p>
                      </div>
                    ) : (
                      event.days.map((day, index) => (
                        <div
                          key={day._id}
                          className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-bgPrimary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          {/* Day Header */}
                          <div
                            onClick={() => toggleDay(day._id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-bgPrimary/20 to-bgPrimaryDark/20 flex items-center justify-center">
                                <span className="text-lg font-bold text-bgPrimaryDark">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar size={16} className="text-bgPrimary" />
                                  <span className="font-bold text-gray-800">
                                    {new Date(day.date).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Layers size={14} />
                                  <span>
                                    {day.programs.length} Program
                                    {day.programs.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDayId(day._id);
                                }}
                                className="p-2.5 rounded-xl bg-gradient-to-br from-bgPrimary to-bgPrimaryDark text-white hover:scale-110 transition-all shadow-md hover:shadow-lg"
                                title="Add program to day"
                              >
                                <Plus size={18} />
                              </button>
                              <div className="p-2 rounded-lg bg-gray-100">
                                {expandedDayIds.has(day._id) ? (
                                  <ChevronDown className="text-gray-600" size={20} />
                                ) : (
                                  <ChevronRight className="text-gray-600" size={20} />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Programs List */}
                          {expandedDayIds.has(day._id) && (
                            <div className="px-5 pb-5 space-y-3 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
                              {day.programs.length === 0 ? (
                                <div className="text-center py-8 rounded-xl border border-dashed border-gray-300 bg-white">
                                  <BookOpen size={40} className="mx-auto mb-2 text-gray-300" />
                                  <p className="text-gray-500 text-sm font-medium">
                                    No programs scheduled
                                  </p>
                                  <button
                                    onClick={() => setSelectedDayId(day._id)}
                                    className="mt-3 text-xs text-bgPrimary hover:text-bgPrimaryDark font-semibold"
                                  >
                                    + Add Program
                                  </button>
                                </div>
                              ) : (
                                day.programs.map((program, pIndex) => (
                                  <div
                                    key={program._id}
                                    className="group/program flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-bgPrimary/40 hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-bgPrimary/10 to-bgPrimaryDark/10 flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-bgPrimary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 mb-1 truncate group-hover/program:text-bgPrimaryDark transition-colors">
                                          {program.title}
                                        </p>
                                        {program.departments && program.departments.length > 0 && (
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {program.departments.slice(0, 3).map((dept) => (
                                              <span
                                                key={dept._id}
                                                className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 font-medium"
                                              >
                                                {dept.name}
                                              </span>
                                            ))}
                                            {program.departments.length > 3 && (
                                              <span className="text-xs text-gray-500">
                                                +{program.departments.length - 3} more
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleRemoveProgram(day._id, program._id)}
                                      disabled={removingProgramId === program._id}
                                      className="flex-shrink-0 p-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Remove program from day"
                                    >
                                      {removingProgramId === program._id ? (
                                        <div className="w-[18px] h-[18px] border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Trash2 size={18} />
                                      )}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <CreateEventForm onCancel={() => setShowEventModal(false)} refetchData={refetch} />
      )}

      {/* Delete Event Confirmation */}
      {deleteEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Event?</h3>
              <p className="text-gray-600 leading-relaxed">
                This will permanently delete this event along with all its days and programs. This
                action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteEventId(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteEventId)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 shadow-lg"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Program to Day Modal */}
      {selectedDayId && (
        <AddProgramInDay
          dayId={selectedDayId}
          onClose={() => setSelectedDayId(null)}
          refetchData={refetch}
        />
      )}
    </div>
  );
};

export default AllEvent;
