"use client";

import { useState } from "react";
import { Edit } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useGetProgramById } from "@/queries/program/program";
import { useGetMyUpdateRequests } from "@/queries/programUpdateRequest/programUpdateRequest";
import RequestUpdateDialog from "@/components/ProgramUpdateRequest/RequestUpdateDialog";
import EventSidebar from "../event/Event";

const Program = () => {
  const { isAdmin, isUser } = useAuth();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const { data: programData, isLoading: programLoading, isError: programError } = useGetProgramById(selectedProgramId ?? "");
  const { data: myRequests } = useGetMyUpdateRequests();

  const program = programData;

  const pendingRequest = myRequests?.find(
    (req) =>
      (typeof req.programId === "object" ? req.programId._id : req.programId) === selectedProgramId &&
      req.status === "pending"
  );

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <EventSidebar selectedEventId={selectedEventId} onProgramSelect={handleProgramSelect} />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {!selectedProgramId ? (
          // Default state: No program selected
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            View the event details in the sidebar
          </div>
        ) : programLoading ? (
          // Loading state
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading program details…</div>
          </div>
        ) : programError || !program ? (
          // Error state
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">Failed to load program details</p>
          </div>
        ) : (
          // Program details
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 mb-1">{program.title}</h1>
              <p className="text-sm text-gray-500">Program Details</p>
            </div>

            {/* Pending Info */}
            {pendingRequest && (
              <div className="mb-6 border border-yellow-200 rounded-lg px-6 py-3 bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  You already have a pending update request for this program. Admin review is in progress.
                </p>
              </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
              {/* Description */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <div
                  className="prose prose-sm max-w-none break-words"
                  style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
                  dangerouslySetInnerHTML={{
                    __html:
                      program.description ||
                      "<p class='text-gray-400 italic'>No description available</p>",
                  }}
                />
              </section>

              {/* Departments */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Departments</h3>

                {program.departments && program.departments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {program.departments.map((dept: any) => (
                      <span
                        key={dept._id}
                        className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {dept.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No departments assigned</p>
                )}
              </section>
            </div>

            {/* Footer Actions */}
            {isUser && !isAdmin && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRequestDialog(true)}
                  disabled={!!pendingRequest}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)",
                  }}
                >
                  <Edit size={16} />
                  {pendingRequest ? "Request Pending" : "Request Update"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Update Dialog */}
      {showRequestDialog && selectedProgramId && program && (
        <RequestUpdateDialog
          programId={selectedProgramId}
          programTitle={program.title}
          currentDescription={program.description || ""}
          onClose={() => setShowRequestDialog(false)}
        />
      )}
    </div>
  );
};

export default Program;
