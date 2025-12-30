"use client";

import { useSubmitUpdateRequest } from "@/queries/programUpdateRequest/programUpdateRequest";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";
import { useState } from "react";
import { toast } from "react-hot-toast";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RequestUpdateDialogProps {
  programId: string;
  programTitle: string;
  currentDescription: string;
  onClose: () => void;
}

const RequestUpdateDialog: React.FC<RequestUpdateDialogProps> = ({
  programId,
  programTitle,
  currentDescription,
  onClose,
}) => {
  const [requestedDescription, setRequestedDescription] = useState(currentDescription || "");
  const { mutate: submitRequest, isPending } = useSubmitUpdateRequest();

  const handleSubmit = () => {
    if (!requestedDescription || requestedDescription.trim() === "") {
      toast.error("Description cannot be empty");
      return;
    }

    if (requestedDescription === currentDescription) {
      toast.error("No changes detected in the description");
      return;
    }

    submitRequest(
      {
        programId,
        requestedDescription,
      },
      {
        onSuccess: () => {
          toast.success("Update request submitted successfully!");
          onClose();
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to submit update request");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Request Description Update</h2>
            <p className="text-sm text-gray-500 mt-1">Program: {programTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition"
            disabled={isPending}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Description
            </label>
            <div
            // className="prose prose-sm max-w-none rounded-lg border border-gray-200 bg-gray-50 p-4"
            // dangerouslySetInnerHTML={{
            //   __html: currentDescription || "<p>No description available</p>",
            // }}
            />
          </div> */}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Description <span className="text-red-500">*</span>
            </label>
            <div className="quill-wrapper rounded-xl border border-gray-300 overflow-hidden">
              <ReactQuill
                theme="snow"
                value={requestedDescription}
                onChange={setRequestedDescription}
                className="bg-white"
                placeholder="Enter the updated description..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This request will be reviewed by an admin before it becomes live.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg px-5 py-2 text-sm font-medium text-white shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
          >
            {isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestUpdateDialog;
