"use client";

import Modal from "@/components/Model";
import { AlertTriangle } from "lucide-react";

interface DeleteDepartmentModalProps {
  departmentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteDepartmentModal = ({
  departmentName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteDepartmentModalProps) => {
  return (
    <Modal onClose={onCancel} isLoading={isDeleting}>
      <div className="text-center space-y-6">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900">Delete Department</h3>

        {/* Warning Message */}
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{departmentName}</span>?
          </p>
          <p className="text-red-600 font-medium">
            This action cannot be undone. This will permanently:
          </p>
          <ul className="text-left list-disc list-inside space-y-1 text-gray-700">
            <li>Remove department from all programs</li>
            <li>Delete all program assignments for this department</li>
            <li>Unassign all users (they become unassigned)</li>
            <li>Delete the department</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Department"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteDepartmentModal;
