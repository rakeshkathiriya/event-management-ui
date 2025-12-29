"use client";

import { Calendar, Plus } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useGetAllEvents } from "@/queries/event/event";
import EventSidebar from "../event/Event";
import CreateEventForm from "../event/EventForm";
import CreateProgramForm from "./ProgramForm";

const Program = () => {
  const { isAdmin } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch all events for admin
  const { data: allEventsData, isLoading: eventsLoading } = useGetAllEvents();

  // Sort events by date (nearest upcoming first)
  const sortedEvents = allEventsData?.data
    ? [...allEventsData.data].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    : [];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <EventSidebar selectedEventId={selectedEventId} />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {isAdmin ? "Events" : "Programs"}
          </h1>

          {/* Admin-only create buttons */}
          {isAdmin && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
              >
                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                Create Program
              </button>

              <button
                onClick={() => setShowEventModal(true)}
                className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
              >
                <Plus size={18} className="transition-transform group-hover:rotate-90" />
                Create Event
              </button>
            </div>
          )}
        </div>

        {/* Content area */}
        {isAdmin ? (
          // Admin: Show all events list
          <div className="space-y-4">
            {eventsLoading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
                Loading events...
              </div>
            ) : sortedEvents.length > 0 ? (
              sortedEvents.map((event) => (
                <button
                  key={event._id}
                  onClick={() => setSelectedEventId(event._id)}
                  className={`w-full rounded-lg border bg-white p-6 text-left transition-all hover:shadow-md ${
                    selectedEventId === event._id
                      ? "border-[#2D6F6D] shadow-md ring-2 ring-[#2D6F6D]/20"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-full p-3 ${
                      selectedEventId === event._id ? "bg-[#2D6F6D]/10" : "bg-gray-100"
                    }`}>
                      <Calendar className={`w-6 h-6 ${
                        selectedEventId === event._id ? "text-[#2D6F6D]" : "text-gray-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                      </p>
                      {event.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                No events found. Create your first event to get started.
              </div>
            )}
          </div>
        ) : (
          // User: Show empty state
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            View the event details in the sidebar
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <CreateProgramForm onCancel={() => setShowAddModal(false)} />}
      {showEventModal && <CreateEventForm onCancel={() => setShowEventModal(false)} />}
    </div>
  );
};

export default Program;
