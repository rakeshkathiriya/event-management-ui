"use client";

import Modal from "@/components/Model";
import { useFormik } from "formik";
import { useCallback } from "react";
import { toast } from "react-toastify";

import { useCreateDepartment, useUpdateDepartment } from "@/queries/department/department";
import { useGetUsers, useGetAllUsers } from "@/queries/user/user";

import type { CreateDepartmentPayload, Department } from "@/utils/types/department";
import { departmentSchema } from "@/utils/validationSchema/departmentSchema";
import { X } from "lucide-react";

interface DepartmentFormProps {
  onCancel: () => void;
  refetchData: () => void;
  department?: Department;
}

const DepartmentForm = ({ onCancel, refetchData, department }: DepartmentFormProps) => {
  const { isPending: isCreating, mutate: createMutate } = useCreateDepartment();
  const { isPending: isUpdating, mutate: updateMutate } = useUpdateDepartment();
  const isEditMode = !!department;

  // Fetch all users when editing (to allow moving users between departments)
  // Fetch only unassigned users when creating
  const { data: unassignedData, isLoading: unassignedLoading, error: unassignedError } = useGetUsers();
  const { data: allUsersData, isLoading: allUsersLoading, error: allUsersError } = useGetAllUsers();

  const usersData = isEditMode ? allUsersData : unassignedData;
  const usersLoading = isEditMode ? allUsersLoading : unassignedLoading;
  const usersError = isEditMode ? allUsersError : unassignedError;

  const isPending = isCreating || isUpdating;
  const usersList = usersData?.data?.users ?? [];

  const handleSubmit = useCallback(
    (payload: CreateDepartmentPayload) => {
      if (isEditMode && department) {
        updateMutate(
          { id: department._id, ...payload },
          {
            onSuccess: (data) => {
              if (data.status) {
                toast.success(data.message ?? "Department updated successfully");
                refetchData();
                onCancel();
              } else {
                toast.error(data.message ?? "Department update failed");
              }
            },
            onError: (error) => {
              toast.error(error.message ?? "Something went wrong");
            },
          }
        );
      } else {
        createMutate(payload, {
          onSuccess: (data) => {
            if (data.status) {
              toast.success(data.message ?? "Department created successfully");
              refetchData();
              onCancel();
            } else {
              toast.error(data.message ?? "Department creation failed");
            }
          },
          onError: (error) => {
            toast.error(error.message ?? "Something went wrong");
          },
        });
      }
    },
    [isEditMode, department, updateMutate, createMutate, onCancel, refetchData]
  );

  const formik = useFormik<CreateDepartmentPayload>({
    initialValues: {
      name: department?.name ?? "",
      description: department?.description ?? "",
      users: department?.users.map((u) => u._id) ?? [],
    },
    validationSchema: departmentSchema,
    onSubmit: handleSubmit,
  });

  const { values, handleChange, handleBlur, handleSubmit: formikSubmit, touched, errors, setFieldValue } = formik;

  return (
    <Modal onClose={onCancel} isLoading={isPending}>
      <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">
        {isEditMode ? "Edit Department" : "Create Department"}
      </h3>

      <form onSubmit={formikSubmit} className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">
            Department Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Department name"
            className={`w-full rounded-xl px-4 py-3 text-sm ${
              touched.name && errors.name
                ? "border border-red-500 "
                : "border border-bgPrimary/30 bg-white"
            }`}
          />
          <p className="min-h-4 text-xs text-red-500">{touched.name && errors.name}</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-bgPrimaryDark">Description</label>
          <textarea
            name="description"
            rows={3}
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full rounded-xl border border-bgPrimary/30 bg-white px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-bgPrimaryDark">
            Assign Users <span className="text-red-500">*</span>
          </label>
          {isEditMode && (
            <p className="text-xs text-gray-500">
              You can add users from other departments - they will be automatically moved.
            </p>
          )}

          {usersLoading && <p className="text-sm text-gray-400">Loading users…</p>}
          {usersError && <p className="text-sm text-red-500">Failed to load users</p>}

          {!usersLoading && !usersError && (
            <>
              <select
                defaultValue=""
                disabled={usersList.length === 0}
                onChange={(e) => {
                  const userId = e.target.value;
                  if (!userId) return;
                  if (!values.users.includes(userId))
                    setFieldValue("users", [...values.users, userId]);
                  e.target.value = "";
                }}
                className="w-full rounded-xl border border-bgPrimary/30 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bgPrimary/60"
              >
                <option value="" disabled>
                  {usersList.length === 0 ? "No users available" : "Select a user to add"}
                </option>
                {usersList
                  .filter((user) => !values.users.includes(user._id))
                  .map((user) => {
                    // Show department info in edit mode
                    const deptInfo = isEditMode && user.departments && user.departments.length > 0
                      ? ` (currently in ${user.departments[0].name})`
                      : "";
                    return (
                      <option key={user._id} value={user._id}>
                        {user.name}{deptInfo}
                      </option>
                    );
                  })}
              </select>

              <div className="flex flex-wrap gap-2">
                {values.users.length === 0 && (
                  <span className="text-xs text-gray-400">No users assigned yet</span>
                )}

                {values.users.map((id) => {
                  const user = usersList.find((u) => u._id === id);
                  if (!user) return null;

                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-full bg-bgPrimary/20 px-3 py-1 text-sm text-bgPrimaryDark"
                    >
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFieldValue(
                            "users",
                            values.users.filter((uid) => uid !== id)
                          )
                        }
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-bgPrimaryDark/40 text-bgPrimaryDark transition hover:bg-bgPrimaryDark hover:text-white"
                        aria-label={`Remove ${user.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="min-h-4 text-xs text-red-500">
                {touched.users && (errors.users as string)}
              </p>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || usersLoading}
          className="w-full rounded-full bg-bgPrimaryDark py-3 font-semibold text-white"
        >
          {isPending
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
            ? "Update Department"
            : "Create Department"}
        </button>
      </form>
    </Modal>
  );
};

export default DepartmentForm;
