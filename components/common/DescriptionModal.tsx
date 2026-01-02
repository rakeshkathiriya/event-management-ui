"use client";

import { useState } from "react";
import Modal from "@/components/Model";
import DepartmentRoleModal from "@/components/Program/DepartmentRoleModal";
import { Department } from "@/utils/types/department";
import { ProgramDepartmentRole } from "@/utils/types/programDepartmentRole";
import { useGetRolesByProgram } from "@/queries/programDepartmentRole/programDepartmentRole";
import { useAuth } from "@/hooks/useAuth";

interface DescriptionModalProps {
  title: string;
  description: string;
  departments?: Department[];
  programId?: string; // Add programId to fetch roles
  footer?: React.ReactNode;
  onClose: () => void;
  isLoading?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  onRoleUpdate?: () => void; // Callback to refetch parent data
}

/**
 * Reusable modal for displaying program descriptions
 *
 * Used in:
 * - ShowEvent.tsx (view program details)
 * - ProgramForm.tsx (preview before creating)
 * - Any other place that needs to display program descriptions
 *
 * Features:
 * - Uses existing Modal component as base
 * - Displays program title, description (React Quill HTML), and departments
 * - Vertically scrollable content (Y-axis)
 * - No horizontal scrolling (X-axis disabled)
 * - Fully responsive
 * - Configurable max-width
 */
const DescriptionModal: React.FC<DescriptionModalProps> = ({
  title,
  description,
  departments = [],
  programId,
  footer,
  onClose,
  isLoading = false,
  maxWidth = "3xl",
  onRoleUpdate,
}) => {
  const { isAdmin, user } = useAuth();

  // Fetch roles for this program (only if programId provided)
  const { data: rolesData, refetch: refetchRoles } = useGetRolesByProgram(
    programId ?? undefined
  );

  // Combined refetch function
  const handleRoleUpdate = async () => {
    // Refetch in parallel for immediate UI update
    await Promise.all([
      refetchRoles(), // Refetch roles in this modal
      onRoleUpdate?.(), // Trigger parent refetch (e.g., AdminProgramList)
    ].filter(Boolean));
  };

  // Role modal state
  const [roleModalState, setRoleModalState] = useState<{
    isOpen: boolean;
    department: Department | null;
    role: ProgramDepartmentRole | null;
  }>({ isOpen: false, department: null, role: null });

  // Handle department click
  const handleDepartmentClick = (department: Department) => {
    if (!programId) return; // Only clickable if programId exists

    // Find role for this department (may be null for create mode)
    const role =
      rolesData?.data?.find((r) => {
        const deptId =
          typeof r.departmentId === "string" ? r.departmentId : r.departmentId._id;
        return deptId === department._id;
      }) || null;

    // Open modal (create or edit mode)
    setRoleModalState({
      isOpen: true,
      department,
      role,
    });
  };

  const handleCloseRoleModal = () => {
    setRoleModalState({ isOpen: false, department: null, role: null });
  };

  // Map maxWidth to Tailwind classes
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <Modal onClose={onClose} isLoading={isLoading}>
      {/* Container with proper width and scrolling */}
      <div className={`w-full ${maxWidthClass} mx-auto flex flex-col overflow-x-hidden`} style={{ maxHeight: "calc(85vh - 100px)" }}>
        {/* Title - Fixed */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#044241] mb-6 break-words flex-shrink-0">
          {title}
        </h2>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 min-h-0">
          {/* Description Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#2D6F6D] mb-3">
              Description
            </h3>

            {/* Description Content - Preserves all formatting */}
            <div
              className="prose prose-sm max-w-none program-description break-words"
              style={{
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {/* Departments */}
          {departments && departments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#2D6F6D] mb-3">
                Assigned Departments
                {programId && (
                  <span className="ml-2 text-xs normal-case text-gray-500 font-normal">
                    (Click to view/edit role)
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept) => {
                  // Check if this department has a role
                  const hasRole = rolesData?.data?.some((r) => {
                    const deptId =
                      typeof r.departmentId === "string"
                        ? r.departmentId
                        : r.departmentId._id;
                    return deptId === dept._id;
                  });

                  return programId ? (
                    // Clickable version (when programId provided)
                    <button
                      key={dept._id}
                      onClick={() => handleDepartmentClick(dept)}
                      className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition break-words ${
                        hasRole
                          ? "bg-[#E6F2F1] text-[#044241] hover:bg-[#044241] hover:text-white border border-[#044241]"
                          : "bg-orange-50 text-orange-600 hover:bg-orange-400 hover:text-white border border-orange-400"
                      }`}
                      title={
                        hasRole
                          ? "Click to view/edit role description"
                          : "Click to create role description"
                      }
                    >
                      {dept.name}
                      {!hasRole && <span className="ml-1">+</span>}
                    </button>
                  ) : (
                    // Non-clickable version (when programId not provided)
                    <span
                      key={dept._id}
                      className="rounded-full bg-[#E6F2F1] px-4 py-2 text-sm font-medium text-[#044241] break-words"
                    >
                      {dept.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Optional Footer - Fixed */}
        {footer && (
          <div className="mt-6 pt-6 border-t border-gray-200 overflow-x-hidden flex-shrink-0">
            {footer}
          </div>
        )}
      </div>

      {/* Department Role Modal */}
      {programId && (
        <DepartmentRoleModal
          isOpen={roleModalState.isOpen}
          onClose={handleCloseRoleModal}
          department={roleModalState.department}
          role={roleModalState.role}
          programId={programId}
          currentUserId={user?._id || ""}
          isAdmin={isAdmin}
          onRoleUpdate={handleRoleUpdate}
          refetchRoles={async () => {
            if (onRoleUpdate) {
              await onRoleUpdate();
            }
          }}
        />
      )}
    </Modal>
  );
};

export default DescriptionModal;
