"use client";

import { useFormik } from "formik";
import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import { toast } from "react-toastify";

import DescriptionModal from "@/components/common/DescriptionModal";
import Modal from "@/components/Model";
import RoleDefinitionModal from "@/components/Program/RoleDefinitionModal";
import { useGetDepartments } from "@/queries/department/department";
import { useCreateProgram, useUpdateProgram } from "@/queries/program/program";
import {
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useGetRolesByProgram,
} from "@/queries/programDepartmentRole/programDepartmentRole";
import type { CreateProgramPayload, Program } from "@/utils/types/program";
import type { Department } from "@/utils/types/department";
import { programSchema } from "@/utils/validationSchema/programSchema";

import { quillFormats, quillModules } from "@/utils/editor/quillConfig";
import { Eye, X, Check, Edit2 } from "lucide-react";
import "quill/dist/quill.snow.css";

// React Quill (React 18 compatible)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

/* ---------------- Types ---------------- */

interface ProgramFormProps {
  onCancel: () => void;
  refetchData?: () => void;
  program?: Program;
}

/* ---------------- Component ---------------- */

const ProgramForm = ({ onCancel, refetchData, program }: ProgramFormProps) => {
  const { mutate: createMutate, isPending: isCreating } = useCreateProgram();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateProgram();
  const { mutateAsync: createRoleAsync } = useCreateRole();
  const { mutateAsync: updateRoleAsync } = useUpdateRole();
  const { mutateAsync: deleteRoleAsync } = useDeleteRole();
  const { data } = useGetDepartments();
  const [showPreview, setShowPreview] = useState(false);

  // Role management state
  const [departmentRoles, setDepartmentRoles] = useState<Map<string, string>>(
    new Map()
  );
  const [existingRoleIds, setExistingRoleIds] = useState<Map<string, string>>(
    new Map()
  );
  const [roleModalState, setRoleModalState] = useState<{
    isOpen: boolean;
    department: Department | null;
  }>({ isOpen: false, department: null });

  const isEditMode = !!program;
  const isPending = isCreating || isUpdating;
  const departments = data?.data?.departments ?? [];

  // Fetch existing roles in edit mode
  const { data: rolesData } = useGetRolesByProgram(
    isEditMode ? program?._id : undefined
  );

  // Populate departmentRoles and existingRoleIds in edit mode
  useEffect(() => {
    if (isEditMode && rolesData?.data) {
      const rolesMap = new Map<string, string>();
      const idsMap = new Map<string, string>();

      rolesData.data.forEach((role) => {
        const deptId =
          typeof role.departmentId === "string"
            ? role.departmentId
            : role.departmentId._id;
        rolesMap.set(deptId, role.roleDescription);
        idsMap.set(deptId, role._id);
      });

      setDepartmentRoles(rolesMap);
      setExistingRoleIds(idsMap);
    }
  }, [isEditMode, rolesData]);

  // Role modal handlers
  const handleRoleSave = (departmentId: string, roleDescription: string) => {
    setDepartmentRoles((prev) => new Map(prev).set(departmentId, roleDescription));
    setRoleModalState({ isOpen: false, department: null });
    toast.success("Role defined successfully");
  };

  const handleRoleCancel = () => {
    // If role not defined, remove department from selection
    if (
      roleModalState.department &&
      !departmentRoles.has(roleModalState.department._id)
    ) {
      setFieldValue(
        "departmentIds",
        values.departmentIds.filter((id) => id !== roleModalState.department?._id)
      );
      toast.info("Department removed - role definition required");
    }
    setRoleModalState({ isOpen: false, department: null });
  };

  const handleSubmit = useCallback(
    async (payload: CreateProgramPayload) => {
      // Validate all departments have roles
      const missingRoles = payload.departmentIds.filter(
        (deptId) => !departmentRoles.has(deptId)
      );

      if (missingRoles.length > 0) {
        toast.error("Please define roles for all selected departments");
        return;
      }

      if (isEditMode && program) {
        // Edit mode - update program and manage roles
        updateMutate(
          { id: program._id, ...payload },
          {
            onSuccess: async (res) => {
              if (res.status) {
                // Handle role operations
                const currentDeptIds = new Set(payload.departmentIds);
                const previousDeptIds = new Set(existingRoleIds.keys());

                const operations: Promise<unknown>[] = [];

                // Create roles for new departments
                payload.departmentIds.forEach((deptId) => {
                  if (!previousDeptIds.has(deptId)) {
                    operations.push(
                      createRoleAsync({
                        programId: program._id,
                        departmentId: deptId,
                        roleDescription: departmentRoles.get(deptId)!,
                      })
                    );
                  } else {
                    // Update existing roles
                    const roleId = existingRoleIds.get(deptId);
                    if (roleId) {
                      operations.push(
                        updateRoleAsync({
                          id: roleId,
                          roleDescription: departmentRoles.get(deptId)!,
                        })
                      );
                    }
                  }
                });

                // Delete roles for removed departments
                previousDeptIds.forEach((deptId) => {
                  if (!currentDeptIds.has(deptId)) {
                    const roleId = existingRoleIds.get(deptId);
                    if (roleId) {
                      operations.push(deleteRoleAsync(roleId));
                    }
                  }
                });


                try {
                  const results = await Promise.allSettled(operations);

                  const failed = results.filter((r) => r.status === "rejected");
                  const succeeded = results.filter((r) => r.status === "fulfilled");


                  if (failed.length > 0) {
                    failed.forEach((result, index) => {
                      if (result.status === "rejected") {
                      }
                    });
                    toast.error(`Program updated but ${failed.length} role operation(s) failed. Check console.`);
                  } else {
                    toast.success("Program and roles updated successfully");
                  }

                  refetchData?.();
                  onCancel();
                } catch (error) {
                  toast.error("Program updated but some role operations failed");
                }
              } else {
                toast.error(res.message || "Failed to update program");
              }
            },
            onError: () => toast.error("Something went wrong"),
          }
        );
      } else {
        // Create mode - create program then roles
        createMutate(payload, {
          onSuccess: async (res) => {
            if (res.status && res.data?._id) {
              const programId = res.data._id;

              // Create roles for each department

              const rolePromises = payload.departmentIds.map(async (deptId) => {
                const roleData = {
                  programId,
                  departmentId: deptId,
                  roleDescription: departmentRoles.get(deptId)!,
                };

                try {
                  const result = await createRoleAsync(roleData);
                  return result;
                } catch (err: any) {
                  throw err;
                }
              });

              try {
                await Promise.all(rolePromises);
                toast.success("Program created with department roles");
                refetchData?.();
                onCancel();
              } catch (error: any) {
                toast.error("Program created but some roles failed to save. Check console for details.");
              }
            } else {
              toast.error(res.message || "Failed to create program");
            }
          },
          onError: () => toast.error("Something went wrong"),
        });
      }
    },
    [
      isEditMode,
      program,
      departmentRoles,
      existingRoleIds,
      updateMutate,
      createMutate,
      createRoleAsync,
      updateRoleAsync,
      deleteRoleAsync,
      onCancel,
      refetchData,
    ]
  );

  const formik = useFormik<CreateProgramPayload>({
    initialValues: {
      title: program?.title ?? "",
      description: program?.description ?? "",
      departmentIds: program?.departments.map((d) => d._id) ?? [],
    },
    validationSchema: programSchema,
    onSubmit: handleSubmit,
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleSubmit: formikHandleSubmit,
    setFieldValue,
  } = formik;

  // Get selected departments for preview
  const selectedDepartments = departments.filter((dept) => values.departmentIds.includes(dept._id));

  return (
    <>
      <Modal onClose={onCancel} isLoading={isPending}>
        <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">
          {isEditMode ? "Edit Program" : "Create Program"}
        </h3>

        <form onSubmit={formikHandleSubmit} className="space-y-6">
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
                modules={quillModules}
                formats={quillFormats}
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
                  const departmentId = e.target.value;
                  if (!departmentId) return;

                  // Check if already selected
                  if (values.departmentIds.includes(departmentId)) {
                    toast.error("Department already selected");
                    e.target.value = "";
                    return;
                  }

                  // Add to formik
                  setFieldValue("departmentIds", [
                    ...values.departmentIds,
                    departmentId,
                  ]);

                  // AUTOMATICALLY open modal for role definition
                  const dept = departments.find((d) => d._id === departmentId);
                  if (dept) {
                    setRoleModalState({ isOpen: true, department: dept });
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

                  const hasRole = departmentRoles.has(id);

                  return (
                    <span
                      key={id}
                      className="flex items-center gap-2 rounded-full bg-bgPrimary/20 px-3 py-1 text-sm text-bgPrimaryDark"
                    >
                      {dept.name}

                      {/* Checkmark indicator if role defined */}
                      {hasRole && (
                        <Check className="size-4 text-green-500" />
                      )}

                      {/* Edit role button */}
                      <button
                        type="button"
                        onClick={() =>
                          setRoleModalState({ isOpen: true, department: dept })
                        }
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="Edit role"
                      >
                        <Edit2 className="size-3" />
                      </button>

                      {/* Remove department button */}
                      <button
                        type="button"
                        onClick={() => {
                          // Remove from departmentIds
                          setFieldValue(
                            "departmentIds",
                            values.departmentIds.filter((d) => d !== id)
                          );

                          // Remove from local roles map (LOCAL STATE ONLY)
                          setDepartmentRoles((prev) => {
                            const newMap = new Map(prev);
                            newMap.delete(id);
                            return newMap;
                          });
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-bgPrimaryDark/40 text-bgPrimaryDark transition hover:bg-bgPrimaryDark hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </span>
                  );
                })}
              </div>

              <p className="text-xs text-red-500">
                {touched.departmentIds && errors.departmentIds}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-bgPrimaryDark py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed"
          >
            {isPending
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Program"
              : "Create Program"}
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

      {/* Role Definition Modal */}
      <RoleDefinitionModal
        isOpen={roleModalState.isOpen}
        onClose={handleRoleCancel}
        department={roleModalState.department}
        initialRoleDescription={
          roleModalState.department
            ? departmentRoles.get(roleModalState.department._id) || ""
            : ""
        }
        onSave={handleRoleSave}
      />
    </>
  );
};

export default ProgramForm;
