"use client";

import { useAuth } from "@/hooks/useAuth";
import { useProgramReorderSync } from "@/hooks/useProgramReorderSync";
import { useReorderProgramsInDay } from "@/queries/day/day";
import { useGetNearestEvent, useGetEventById } from "@/queries/event/event";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, ChevronDown, ChevronRight, GripVertical, Layers, Plus } from "lucide-react";
import { useState } from "react";
import AddProgramInDay from "./day";

interface SortableProgramProps {
  program: {
    _id: string;
    title: string;
  };
  onClick: () => void;
  isAdmin: boolean;
}

function SortableProgram({ program, onClick, isAdmin }: SortableProgramProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: program._id,
    disabled: !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full flex items-center gap-3 rounded-lg bg-white border px-3 py-2 hover:shadow-md transition"
    >
      {isAdmin && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <button onClick={onClick} className="flex-1 flex items-center gap-3 text-left">
        <div className="p-2 rounded-full bg-[#2D6F6D]/10">
          <Layers className="w-4 h-4 text-[#2D6F6D]" />
        </div>
        <span className="text-sm font-medium text-gray-800">{program.title}</span>
      </button>
    </div>
  );
}

interface EventSidebarProps {
  selectedEventId?: string | null;
  onProgramSelect: (programId: string) => void;
}

export default function EventSidebar({ selectedEventId, onProgramSelect }: EventSidebarProps) {
  const { isAdmin } = useAuth();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // For admin with selected event, fetch that event; otherwise fetch nearest event
  const { data: nearestEventData, isLoading: nearestLoading, isError: nearestError, refetch: refetchNearest } = useGetNearestEvent();
  const { data: selectedEventData, isLoading: selectedLoading, isError: selectedError, refetch: refetchSelected } = useGetEventById(isAdmin ? selectedEventId ?? null : null);

  const reorderMutation = useReorderProgramsInDay();

  // Determine which event to display
  const data = isAdmin && selectedEventId ? selectedEventData : nearestEventData;
  const isLoading = isAdmin && selectedEventId ? selectedLoading : nearestLoading;
  const isError = isAdmin && selectedEventId ? selectedError : nearestError;
  const refetch = isAdmin && selectedEventId ? refetchSelected : refetchNearest;

  // Real-time sync: Listen for program reorder events from other users
  useProgramReorderSync();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent, dayId: string, programs: any[]) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = programs.findIndex((p) => p._id === active.id);
    const newIndex = programs.findIndex((p) => p._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally
    const reorderedPrograms = arrayMove(programs, oldIndex, newIndex);
    const programIds = reorderedPrograms.map((p) => p._id);

    // Call backend API
    reorderMutation.mutate(
      {
        dayId,
        payload: { programIds },
      },
      {
        onSuccess: () => {
          // Refetch to ensure sync with server
          refetch();
        },
        onError: (error) => {
          console.error("Failed to reorder programs:", error);
          // Refetch to revert optimistic update
          refetch();
        },
      }
    );
  };

  if (isLoading) return <p className="p-6 text-gray-500">Loading events...</p>;

  if (isError || !data?.data) return <p className="p-6 text-red-500">Failed to load events</p>;

  const event = data.data;

  return (
    <>
      <aside className="w-85 h-screen bg-white border-r shadow-sm overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b bg-[#044241] text-white">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <p className="text-sm opacity-90">
            {new Date(event.startDate).toDateString()} - {new Date(event.endDate).toDateString()}
          </p>
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
                  <span className="font-medium flex gap-35 justify-between text-gray-800">
                    {new Date(day.date).toLocaleDateString()}
                    {/* Admin-only add program button */}
                    {isAdmin && (
                      <div
                        className="bg-bgPrimary/50 rounded-full cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayId(day._id);
                          setShowDayModal(true);
                        }}
                      >
                        <Plus />
                      </div>
                    )}
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, day._id, day.programs)}
                  >
                    <SortableContext
                      items={day.programs.map((p) => p._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {day.programs.map((program) => (
                        <SortableProgram
                          key={program._id}
                          program={program}
                          onClick={() => onProgramSelect(program._id)}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {showDayModal && selectedDayId && (
        <AddProgramInDay
          dayId={selectedDayId}
          onClose={() => setShowDayModal(false)}
          refetchData={refetch}
        />
      )}
    </>
  );
}
