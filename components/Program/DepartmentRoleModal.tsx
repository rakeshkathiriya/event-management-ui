"use client";

import {
  useCreateRole,
  useUpdateRole,
} from "@/queries/programDepartmentRole/programDepartmentRole";
import { quillFormats, quillModules } from "@/utils/editor/quillConfig";
import { Department } from "@/utils/types/department";
import { ProgramDepartmentRole } from "@/utils/types/programDepartmentRole";

import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Save, X } from "lucide-react";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../Model";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface DepartmentRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  role: ProgramDepartmentRole | null;
  programId: string;
  currentUserId: string;
  isAdmin: boolean;
  onRoleUpdate?: () => void;
  refetchRoles: () => Promise<any>;
}

const DepartmentRoleModal = ({
  isOpen,
  onClose,
  department,
  refetchRoles,
  role,
  programId,
  currentUserId,
  isAdmin,
  onRoleUpdate,
}: DepartmentRoleModalProps) => {
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

  const { mutateAsync: createRoleAsync, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRoleAsync, isPending: isUpdating } = useUpdateRole();

  const isSaving = isCreating || isUpdating;

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setEditedDescription(role.roleDescription);
        setIsEditMode(false);
      } else {
        setEditedDescription("");
        setIsEditMode(true);
      }
    }
  }, [isOpen, role]);

  /* ---------------- ACCESS CONTROL ---------------- */

  const hasAccess = () => {
    if (!department || !currentUserId) return false;
    if (isAdmin) return true;

    const userIds = department.users?.map((u) => (typeof u === "string" ? u : u._id)) || [];

    return userIds.includes(currentUserId);
  };

  const canEdit = () => {
    if (isAdmin) return true;

    const userIds = department?.users?.map((u) => (typeof u === "string" ? u : u._id)) || [];

    return userIds.includes(currentUserId);
  };

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    if (!editedDescription.trim()) {
      toast.error("Role description cannot be empty");
      return;
    }

    const strippedContent = editedDescription.replace(/<[^>]*>/g, "").trim();
    if (!strippedContent) {
      toast.error("Please enter a role description");
      return;
    }

    if (!department?._id || !programId) {
      toast.error("Missing department or program information");
      return;
    }

    try {
      if (role) {
        await updateRoleAsync({
          id: role._id,
          roleDescription: editedDescription,
        });
        toast.success("Role description updated successfully");
      } else {
        await createRoleAsync({
          programId,
          departmentId: department._id,
          roleDescription: editedDescription,
        });
        toast.success("Role description created successfully");
      }

      /* ✅ GLOBAL REFRESH (FIX) */
      await queryClient.invalidateQueries({
        queryKey: ["programDepartmentRoles", programId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["program", programId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["adminProgramList"],
      });

      /* ✅ KEEP YOUR EXISTING LOGIC */
      await refetchRoles();

      setIsEditMode(false);

      if (onRoleUpdate) {
        await onRoleUpdate();
      }
    } catch (error) {
      toast.error(role ? "Failed to update role description" : "Failed to create role description");
    }
  };

  const handleCancel = () => {
    if (role) {
      setEditedDescription(role.roleDescription);
      setIsEditMode(false);
    } else {
      onClose();
    }
  };

  /* ---------------- RENDER ---------------- */

  if (!isOpen || !department) return null;

  if (!hasAccess()) {
    return (
      <Modal onClose={onClose}>
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-600">
            You do not have permission to view this department role description.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} isLoading={isSaving}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-bgPrimaryDark">{department.name}</h2>
            <p className="text-sm text-gray-500">Responsibility</p>
          </div>

          {canEdit() && !isEditMode && role && (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 rounded-lg border border-bgPrimary px-4 py-2 text-sm font-medium text-bgPrimary transition hover:bg-bgPrimary hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6 max-h-[60vh] overflow-y-auto">
          {isEditMode ? (
            <div className="quill-wrapper overflow-hidden rounded-xl border border-bgPrimary/30">
              <ReactQuill
                theme="snow"
                value={editedDescription}
                onChange={setEditedDescription}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white"
                placeholder="Enter role description..."
              />
            </div>
          ) : (
            role && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div
                  className="ql-editor prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: role.roleDescription,
                  }}
                />
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          {isEditMode ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-xl border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-bgPrimary px-6 py-2 text-white hover:bg-bgPrimary/90"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : role ? "Save Changes" : "Create Role"}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="rounded-xl bg-bgPrimaryDark px-6 py-2 text-white">
              Close
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DepartmentRoleModal;
