"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Modal from "../Model";
import { Department } from "@/utils/types/department";
import { quillFormats, quillModules } from "@/utils/editor/quillConfig";
import "quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RoleDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  initialRoleDescription?: string;
  onSave: (departmentId: string, roleDescription: string) => void;
}

const RoleDefinitionModal = ({
  isOpen,
  onClose,
  department,
  initialRoleDescription = "",
  onSave,
}: RoleDefinitionModalProps) => {
  const [roleDescription, setRoleDescription] = useState(
    initialRoleDescription
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update roleDescription when modal opens or initialRoleDescription changes
  useEffect(() => {
    if (isOpen) {
      setRoleDescription(initialRoleDescription);
    }
  }, [isOpen, initialRoleDescription]);

  const handleSave = () => {
    if (!department) return;

    // Validate roleDescription is not empty
    const strippedContent = roleDescription.replace(/<[^>]*>/g, "").trim();
    if (!strippedContent) {
      alert("Please enter a role description");
      return;
    }

    setIsSaving(true);

    // Call onSave callback
    onSave(department._id, roleDescription);

    setIsSaving(false);
  };

  const handleCancel = () => {
    setRoleDescription(initialRoleDescription);
    onClose();
  };

  if (!isOpen || !department) return null;

  return (
    <Modal onClose={handleCancel} isLoading={isSaving}>
      <div className="p-6">
        {/* Header */}
        <h2 className="mb-4 text-2xl font-bold text-bgPrimaryDark">
          Define Role for {department.name}
        </h2>

        <p className="mb-6 text-sm text-gray-600">
          Describe the role and responsibilities for this department in the
          program.
        </p>

        {/* Quill Editor */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-bgPrimaryDark">
            Role Description <span className="text-red-500">*</span>
          </label>

          <div className="quill-wrapper overflow-hidden rounded-xl border border-bgPrimary/30">
            <ReactQuill
              theme="snow"
              value={roleDescription}
              onChange={setRoleDescription}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white"
              placeholder="Enter role description..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="rounded-xl border border-bgPrimary/30 px-6 py-2 text-bgPrimaryDark transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-bgPrimary px-6 py-2 text-white transition hover:bg-bgPrimary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RoleDefinitionModal;
