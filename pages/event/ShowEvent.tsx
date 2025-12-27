"use client";

import { useState } from "react";
import { useGetProgramById } from "@/queries/program/program";
import { useAuth } from "@/hooks/useAuth";
import RequestUpdateDialog from "@/components/ProgramUpdateRequest/RequestUpdateDialog";
import { useGetMyUpdateRequests } from "@/queries/programUpdateRequest/programUpdateRequest";
import DescriptionModal from "@/components/common/DescriptionModal";
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
      <DescriptionModal
        title="Loading..."
        description="<p class='text-gray-600'>Loading program details...</p>"
        onClose={onClose}
        isLoading={true}
        maxWidth="4xl"
      />
    );
  }

  if (isError || !data) {
    return (
      <DescriptionModal
        title="Error"
        description="<p class='text-red-500'>Failed to load program details. Please try again.</p>"
        onClose={onClose}
        maxWidth="4xl"
      />
    );
  }

  const program = data;

  // Find pending request for this program
  const pendingRequest = myRequests?.find(
    (req) =>
      (typeof req.programId === "object" ? req.programId._id : req.programId) === programId &&
      req.status === "pending"
  );

  // Footer with Request Update button (for users only)
  const footer = (
    <div className="space-y-4">
      {/* Pending Request Notice */}
      {pendingRequest && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm text-yellow-800">
            You have a pending update request for this program. It is awaiting admin review.
          </p>
        </div>
      )}

      {/* Request Update Button (USER only) */}
      {isUser && !isAdmin && (
        <button
          onClick={() => setShowRequestDialog(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
          disabled={!!pendingRequest}
        >
          <Edit size={16} />
          {pendingRequest ? "Request Pending" : "Request Update"}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Description Modal - Direct usage with proper scrolling */}
      <DescriptionModal
        title={program.title}
        description={program.description || "<p class='text-gray-400 italic'>No description available</p>"}
        departments={program.departments}
        footer={isUser && !isAdmin ? footer : undefined}
        onClose={onClose}
        maxWidth="4xl"
      />

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
