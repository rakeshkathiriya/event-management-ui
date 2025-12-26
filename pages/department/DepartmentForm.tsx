"use client";

import Modal from "@/components/Model";
import { useFormik } from "formik";
import { useCallback } from "react";
import { toast } from "react-toastify";

import { useCreateDepartment } from "@/queries/department/department";
import { useGetUsers } from "@/queries/user/user";

import type { CreateDepartmentPayload } from "@/utils/types/department";
import { departmentSchema } from "@/utils/validationSchema/departmentSchema";
import { X } from "lucide-react";

interface DepartmentFormProps {
  onCancel: () => void;
  refetchData: () => void;
}

const DepartmentForm = ({ onCancel, refetchData }: DepartmentFormProps) => {
  const { isPending, mutate } = useCreateDepartment();
  const { data: usersData, isLoading: usersLoading, error: usersError } = useGetUsers();

  const usersList = usersData?.data?.users ?? [];

  const handleCreate = useCallback(
    (payload: CreateDepartmentPayload) => {
      mutate(payload, {
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
    },
    [mutate, onCancel, refetchData]
  );

  const formik = useFormik<CreateDepartmentPayload>({
    initialValues: { name: "", description: "", users: [] },
    validationSchema: departmentSchema,
    onSubmit: handleCreate,
  });

  const { values, handleChange, handleBlur, handleSubmit, touched, errors, setFieldValue } = formik;

  return (
    <Modal onClose={onCancel} isLoading={isPending}>
      <h3 className="mb-6 text-center text-xl font-semibold text-bgPrimaryDark">
        Create Department
      </h3>

      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-6">
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
                  {usersList.length === 0 ? "No users available" : "Select a user"}
                </option>
                {usersList.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
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
          {isPending ? "Creating..." : "Create Department"}
        </button>
      </form>
    </Modal>
  );
};

export default DepartmentForm;
