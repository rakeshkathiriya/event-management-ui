"use client";

import RequestUpdateDialog from "@/components/ProgramUpdateRequest/RequestUpdateDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGetProgramById } from "@/queries/program/program";
import { useGetMyUpdateRequests } from "@/queries/programUpdateRequest/programUpdateRequest";
import { Edit, X } from "lucide-react";
import { useState } from "react";

interface ShowProgramProps {
  programId: string;
  onClose: () => void;
}

const ShowProgram = ({ programId, onClose }: ShowProgramProps) => {
  const { data, isLoading, isError } = useGetProgramById(programId);
  const { data: myRequests } = useGetMyUpdateRequests();
  const { isUser, isAdmin } = useAuth();
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
          <p className="text-gray-600">Loading program details…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
          <p className="text-red-500">Failed to load program details</p>
        </div>
      </div>
    );
  }

  const program = data;

  const pendingRequest = myRequests?.find(
    (req) =>
      (typeof req.programId === "object" ? req.programId._id : req.programId) === programId &&
      req.status === "pending"
  );

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl flex flex-col"
          style={{ maxHeight: "calc(100vh - 4rem)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50 flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 truncate">{program.title}</h2>
              <p className="text-sm text-gray-500 mt-1 truncate">Program Details</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-200 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Pending Info */}
          {pendingRequest && (
            <div className="border-b px-6 py-3 bg-yellow-50 flex-shrink-0">
              <p className="text-sm text-yellow-800">
                You already have a pending update request for this program. Admin review is in
                progress.
              </p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-8">
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

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t px-6 py-4 bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-white transition"
            >
              Close
            </button>

            {isUser && !isAdmin && (
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
            )}
          </div>
        </div>
      </div>

      {/* Request Update Dialog */}
      {showRequestDialog && (
        <RequestUpdateDialog
          programId={programId}
          programTitle={program.title}
          currentDescription={program.description || ""}
          onClose={() => setShowRequestDialog(false)}
        />
      )}
    </>
  );
};

export default ShowProgram;
