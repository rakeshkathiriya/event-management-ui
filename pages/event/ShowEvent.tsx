"use client";

import { useState } from "react";
import Modal from "@/components/Model";
import { useGetProgramById } from "@/queries/program/program";
import { Department } from "@/utils/types/department";
import { useAuth } from "@/hooks/useAuth";
import RequestUpdateDialog from "@/components/ProgramUpdateRequest/RequestUpdateDialog";
import { useGetMyUpdateRequests } from "@/queries/programUpdateRequest/programUpdateRequest";
import { Edit } from "lucide-react";

interface ShowProgramProps {
  programId: string;
  onClose: () => void;
}

const ShowProgram = ({ programId, onClose }: ShowProgramProps) => {
  const { data, isLoading, isError } = useGetProgramById(programId);
  const { isUser, isAdmin } = useAuth();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { data: myRequests } = useGetMyUpdateRequests();

  if (isLoading) {
    return (
      <Modal onClose={onClose}>
        <div className="flex items-center justify-center py-10 text-gray-600">
          Loading program...
        </div>
      </Modal>
    );
  }

  if (isError || !data) {
    return (
      <Modal onClose={onClose}>
        <div className="py-10 text-center text-red-500">Failed to load program</div>
      </Modal>
    );
  }

  const program = data;

  // Find pending request for this program
  const pendingRequest = myRequests?.find(
    (req) =>
      (typeof req.programId === 'object' ? req.programId._id : req.programId) === programId &&
      req.status === 'pending'
  );

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 sm:p-8">
        {/* Title */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#044241]">{program.title}</h2>

          {/* Request Update Button (USER only) */}
          {isUser && !isAdmin && (
            <button
              onClick={() => setShowRequestDialog(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
              disabled={!!pendingRequest}
            >
              <Edit size={16} />
              {pendingRequest ? "Request Pending" : "Request Update"}
            </button>
          )}
        </div>

        {/* Pending Request Notice */}
        {pendingRequest && (
          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              You have a pending update request for this program. It is awaiting admin review.
            </p>
          </div>
        )}

        {/* Description (React-Quill HTML) */}
        <div
          className="program-description"
          dangerouslySetInnerHTML={{ __html: program.description }}
        />
        {/* Divider */}
        <div className="my-8 h-px bg-gray-200" />

        {/* Departments */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#2D6F6D]">
            Assigned Departments
          </h3>

          {program.departments.length === 0 ? (
            <p className="text-sm text-gray-500">No departments assigned</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {program.departments.map((dept: Department) => (
                <span
                  key={dept._id}
                  className="rounded-full bg-[#E6F2F1] px-4 py-2 text-sm font-medium text-[#044241]"
                >
                  {dept.name}
                </span>
              ))}
            </div>
          )}
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
    </Modal>
  );
};

export default ShowProgram;
