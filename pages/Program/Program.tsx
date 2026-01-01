"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";

import DepartmentRoleModal from "@/components/Program/DepartmentRoleModal";
import RequestUpdateDialog from "@/components/ProgramUpdateRequest/RequestUpdateDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGetProgramById } from "@/queries/program/program";
import { useGetRolesByProgram } from "@/queries/programDepartmentRole/programDepartmentRole";
import { useGetMyUpdateRequests } from "@/queries/programUpdateRequest/programUpdateRequest";
import type { Department } from "@/utils/types/department";
import type { ProgramDepartmentRole } from "@/utils/types/programDepartmentRole";
import EventSidebar from "../event/Event";

const Program = () => {
  const { isAdmin, isUser, user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const [roleModalState, setRoleModalState] = useState<{
    isOpen: boolean;
    department: Department | null;
    role: ProgramDepartmentRole | null;
  }>({ isOpen: false, department: null, role: null });

  const {
    data: programData,
    isLoading: programLoading,
    isError: programError,
    refetch: refetchProgram,
  } = useGetProgramById(selectedProgramId ?? "");

  const { data: myRequests } = useGetMyUpdateRequests();

  const { data: rolesData, refetch: refetchRoles } = useGetRolesByProgram(
    selectedProgramId ?? undefined
  );

  const program = programData;

  /* -------------------------------------------------- */
  /* ✅ KEY FIX: SYNC ROLE AFTER ROLES REFRESH           */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!roleModalState.isOpen || !roleModalState.department || !rolesData?.data) return;

    const updatedRole =
      rolesData.data.find((r) => {
        const deptId = typeof r.departmentId === "string" ? r.departmentId : r.departmentId._id;
        return deptId === roleModalState.department!._id;
      }) || null;

    setRoleModalState((prev) => ({
      ...prev,
      role: updatedRole,
    }));
  }, [rolesData, roleModalState.isOpen, roleModalState.department]);

  /* -------------------------------------------------- */
  /* GLOBAL REFRESH (KEEPING YOUR LOGIC)                 */
  /* -------------------------------------------------- */
  const handleRoleUpdate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["programDepartmentRoles", selectedProgramId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["program", selectedProgramId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["adminProgramList"],
      }),
    ]);

    await Promise.all([refetchRoles(), refetchProgram()]);
  };

  const isUserInProgramDepartment = () => {
    if (!user?._id || !program?.departments) return false;

    return program.departments.some((dept: any) => {
      const userIds = dept.users?.map((u: any) => (typeof u === "string" ? u : u._id)) || [];
      return userIds.includes(user._id);
    });
  };

  const pendingRequest = myRequests?.find(
    (req) =>
      (typeof req.programId === "object" ? req.programId._id : req.programId) ===
        selectedProgramId && req.status === "pending"
  );

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId);
  };

  const handleDepartmentClick = (department: Department) => {
    const role =
      rolesData?.data?.find((r) => {
        const deptId = typeof r.departmentId === "string" ? r.departmentId : r.departmentId._id;
        return deptId === department._id;
      }) || null;

    setRoleModalState({
      isOpen: true,
      department,
      role,
    });
  };

  const handleCloseRoleModal = async () => {
    await Promise.all([refetchRoles(), refetchProgram()]);
    setRoleModalState({ isOpen: false, department: null, role: null });
  };

  return (
    <div className="flex h-screen">
      <EventSidebar selectedEventId={selectedEventId} onProgramSelect={handleProgramSelect} />

      <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {!selectedProgramId ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            View the event details in the sidebar
          </div>
        ) : programLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading program details…</div>
          </div>
        ) : programError || !program ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">Failed to load program details</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 mb-1">{program.title}</h1>
              <p className="text-sm text-gray-500">Program Details</p>
            </div>

            {pendingRequest && (
              <div className="mb-6 border border-yellow-200 rounded-lg px-6 py-3 bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  You already have a pending update request for this program.
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      program.description ||
                      "<p class='text-gray-400 italic'>No description available</p>",
                  }}
                />
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Departments</h3>

                <div className="flex flex-wrap gap-2">
                  {program.departments.map((dept: any) => {
                    const hasRole = rolesData?.data?.some((r) => {
                      const deptId =
                        typeof r.departmentId === "string" ? r.departmentId : r.departmentId._id;
                      return deptId === dept._id;
                    });

                    return (
                      <button
                        key={dept._id}
                        onClick={() => handleDepartmentClick(dept)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          hasRole
                            ? "border-bgPrimary bg-bgPrimary/10 text-bgPrimary"
                            : "border-orange-400 bg-orange-50 text-orange-600"
                        }`}
                      >
                        {dept.name}
                        {!hasRole && <span className="ml-1">+</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {isUser && !isAdmin && isUserInProgramDepartment() && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRequestDialog(true)}
                  disabled={!!pendingRequest}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-white flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)",
                  }}
                >
                  <Edit size={16} />
                  Request Update
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showRequestDialog && selectedProgramId && program && (
        <RequestUpdateDialog
          programId={selectedProgramId}
          programTitle={program.title}
          currentDescription={program.description || ""}
          onClose={() => setShowRequestDialog(false)}
        />
      )}

      <DepartmentRoleModal
        isOpen={roleModalState.isOpen}
        refetchRoles={refetchRoles}
        onClose={handleCloseRoleModal}
        department={roleModalState.department}
        role={roleModalState.role}
        programId={selectedProgramId || ""}
        currentUserId={user?._id || ""}
        isAdmin={isAdmin}
        onRoleUpdate={handleRoleUpdate}
      />
    </div>
  );
};

export default Program;
