"use client";

import { useFormik } from "formik";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import Modal from "@/components/Model";
import { useGetDepartments } from "@/queries/department/department";
import { useCreateProgram } from "@/queries/program/program";
import { programSchema } from "@/utils/validationSchema/programSchema";
import DescriptionModal from "@/components/common/DescriptionModal";

import { X, Eye } from "lucide-react";
import "quill/dist/quill.snow.css";

// React Quill (React 18 compatible)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

/* ---------------- Types ---------------- */

interface CreateProgramPayload {
  title: string;
  description: string;
  departmentIds: string[];
}

interface Department {
  _id: string;
  name: string;
}

interface CreateProgramFormProps {
  onCancel: () => void;
  refetchData?: () => void;
}

/* ---------------- Component ---------------- */

const CreateProgramForm = ({ onCancel, refetchData }: CreateProgramFormProps) => {
  const { mutate, isPending } = useCreateProgram();
  const { data } = useGetDepartments();
  const [showPreview, setShowPreview] = useState(false);

  const departments: Department[] = data?.data?.departments ?? [];

  const handleCreate = useCallback(
    (payload: CreateProgramPayload) => {
      mutate(payload, {
        onSuccess: (res) => {
          if (res.status) {
            toast.success(res.message || "Program created successfully");
            refetchData?.();
            onCancel();
          } else {
            toast.error(res.message || "Failed to create program");
          }
        },
        onError: () => toast.error("Something went wrong"),
      });
    },
    [mutate, onCancel, refetchData]
  );

  const formik = useFormik<CreateProgramPayload>({
    initialValues: {
      title: "",
      description: "",
      departmentIds: [],
    },
    validationSchema: programSchema,
    onSubmit: handleCreate,
  });

  const { values, errors, touched, handleChange, handleSubmit, setFieldValue } = formik;

  // Get selected departments for preview
  const selectedDepartments = departments.filter((dept) =>
    values.departmentIds.includes(dept._id)
  );

  return (
    <>
      <Modal onClose={onCancel} isLoading={isPending}>
        <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">Create Program</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Program Title */}
          <div>
            <label className="text-sm font-medium text-bgPrimaryDark">
              Program Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={values.title}
              onChange={handleChange}
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm ${
                touched.title && errors.title ? "border-red-500" : "border-bgPrimary/30"
              }`}
              placeholder="Enter program title"
            />
            <p className="text-xs text-red-500">{touched.title && errors.title}</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-bgPrimaryDark">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="quill-wrapper mt-2 rounded-xl border border-bgPrimary/30 overflow-hidden">
              <ReactQuill
                theme="snow"
                value={values.description}
                onChange={(val) => setFieldValue("description", val)}
                className="bg-white"
              />
            </div>
            <p className="text-xs text-red-500">{touched.description && errors.description}</p>

            {/* Preview Button */}
            {values.description && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-bgPrimary/30 text-bgPrimaryDark transition hover:bg-bgPrimary/10"
              >
                <Eye size={16} />
                Preview Description
              </button>
            )}
          </div>

          {/* Department Selector */}
          <div>
            <label className="text-sm font-medium text-bgPrimaryDark">
              Assign Departments <span className="text-red-500">*</span>
            </label>

            <div className="mt-2 space-y-2">
              <select
                className="w-full rounded-xl border px-4 py-3"
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  if (!values.departmentIds.includes(id)) {
                    setFieldValue("departmentIds", [...values.departmentIds, id]);
                  }
                  e.target.value = "";
                }}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2">
                {values.departmentIds.map((id) => {
                  const dept = departments.find((d) => d._id === id);
                  if (!dept) return null;

                  return (
                    <span
                      key={id}
                      className="flex items-center gap-2 rounded-full bg-bgPrimary/20 px-3 py-1 text-sm text-bgPrimaryDark"
                    >
                      {dept.name}
                      <button
                        type="button"
                        onClick={() =>
                          setFieldValue(
                            "departmentIds",
                            values.departmentIds.filter((d) => d !== id)
                          )
                        }
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-bgPrimaryDark/40 text-bgPrimaryDark transition hover:bg-bgPrimaryDark hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </span>
                  );
                })}
              </div>

              <p className="text-xs text-red-500">{touched.departmentIds && errors.departmentIds}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-bgPrimaryDark py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create Program"}
          </button>
        </form>
      </Modal>

      {/* Preview Modal */}
      {showPreview && (
        <DescriptionModal
          title={values.title || "Untitled Program"}
          description={values.description || "<p class='text-gray-400 italic'>No description</p>"}
          departments={selectedDepartments}
          maxWidth="4xl"
          footer={
            <button
              onClick={() => setShowPreview(false)}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-white transition"
            >
              Close Preview
            </button>
          }
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default CreateProgramForm;
