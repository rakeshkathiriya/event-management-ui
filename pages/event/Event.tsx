"use client";

import { useGetNearestEvent } from "@/queries/event/event";
import { Calendar, ChevronDown, ChevronRight, Layers, Plus } from "lucide-react";
import { useState } from "react";
import ShowEvent from "./ShowEvent";

export default function EventSidebar() {
  const [showModal, setShowModal] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const { data, isLoading, isError } = useGetNearestEvent();

  if (isLoading) return <p className="p-6 text-gray-500">Loading events...</p>;

  if (isError || !data?.data) return <p className="p-6 text-red-500">Failed to load events</p>;

  const event = data.data;

  return (
    <>
      <aside className="w-85 h-screen bg-white border-r shadow-sm overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b bg-[#044241] text-white">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <p className="text-sm opacity-90">{new Date(event.startDate).toDateString()}</p>
        </div>

        {/* Days */}
        <div className="p-3 space-y-3">
          {event.days.map((day) => (
            <div key={day._id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
              {/* Day Header */}
              <button
                onClick={() => setOpenDay(openDay === day._id ? null : day._id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-bgPrimary" />
                  <span className="font-medium flex  gap-35 justify-between text-gray-800">
                    {new Date(day.date).toLocaleDateString()}
                    <div
                      className="bg-bgPrimary/50 rounded-full"
                      onClick={() => {
                        setSelectedDayId(day._id);
                        setShowDayModal(true);
                      }}
                    >
                      <Plus />
                    </div>
                  </span>
                </div>
                {openDay === day._id ? (
                  <ChevronDown className="text-gray-500" />
                ) : (
                  <ChevronRight className="text-gray-500" />
                )}
              </button>

              {/* Programs */}
              {openDay === day._id && (
                <div className="bg-[#F6FAF9] px-4 py-3 space-y-2">
                  {day.programs.map((program) => (
                    <button
                      key={program._id}
                      onClick={() => {
                        setSelectedProgramId(program._id);
                        setShowModal(true);
                      }}
                      className="w-full flex items-center gap-3 rounded-lg bg-white border px-3 py-2 hover:shadow-md transition"
                    >
                      <div className="p-2 rounded-full bg-[#2D6F6D]/10">
                        <Layers className="w-4 h-4 text-[#2D6F6D]" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{program.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
      {/* Modal */}
      {showModal && selectedProgramId && (
        <ShowEvent programId={selectedProgramId} onClose={() => setShowModal(false)} />
      )}

      {showDayModal && selectedDayId && (
        <ShowEvent programId={selectedDayId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
