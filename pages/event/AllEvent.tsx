"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import CreateEventForm from "./EventForm";

const AllEvent = () => {
  const [showEventModal, setShowEventModal] = useState(false);
  return (
    <>
      <div>
        <button
          onClick={() => setShowEventModal(true)}
          className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          Create Event
        </button>
      </div>
      {showEventModal && <CreateEventForm onCancel={() => setShowEventModal(false)} />}
    </>
  );
};

export default AllEvent;
