"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import EventSidebar from "../event/Event";
import CreateEventForm from "../event/EventForm";
import CreateProgramForm from "./ProgramForm";

const Program = () => {
  const { isAdmin } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <EventSidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Programs</h1>

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

        {/* Content area placeholder */}
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Select an event from the sidebar to view details
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <CreateProgramForm onCancel={() => setShowAddModal(false)} />}
      {showEventModal && <CreateEventForm onCancel={() => setShowEventModal(false)} />}
    </div>
  );
};

export default Program;
