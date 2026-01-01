"use client";

import { Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import DeleteDepartmentModal from "@/components/common/DeleteDepartmentModal";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteDepartment, useGetDepartments } from "@/queries/department/department";
import { useQueryClient } from "@tanstack/react-query";
import type { Department as DepartmentType } from "@/utils/types/department";
import DepartmentForm from "./DepartmentForm";

const Department = () => {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState<DepartmentType | null>(null);
  const [deleteDepartment, setDeleteDepartment] = useState<DepartmentType | null>(null);
  const { data, isLoading, error, refetch } = useGetDepartments();
  const { mutate: deleteDept, isPending: isDeleting } = useDeleteDepartment();

  const departments = data?.data?.departments ?? [];
  const totalUsers = departments.reduce((sum, d) => sum + d.totalUsers, 0);

  // Delete handler with optimized cache invalidation
  const handleDeleteDepartment = (deptId: string) => {
    deleteDept(deptId, {
      onSuccess: (data) => {
        if (data.status) {
          toast.success(data.message ?? "Department deleted successfully");

          // Check if this was the last department
          const currentDepartmentCount = departments.length;

          if (currentDepartmentCount <= 1) {
            // Last item: Force immediate invalidation and refetch
            queryClient.invalidateQueries({
              queryKey: ["useGetDepartments"],
              refetchType: 'active'
            });
          } else {
            // Multiple items: Standard invalidation
            queryClient.invalidateQueries({
              queryKey: ["useGetDepartments"]
            });
          }

          setDeleteDepartment(null);
        } else {
          toast.error(data.message ?? "Failed to delete department");
        }
      },
      onError: (error) => {
        toast.error(error.message ?? "Something went wrong");
      },
    });
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/main/programs");
    }
  }, [isAdmin, authLoading, router]);

  // Show loading while checking permissions
  if (authLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-bgPrimaryDark">Departments</h2>
          <p className="mt-1 text-sm text-gray-500">Manage departments and assigned users</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          <span>Create Department</span>
        </button>
      </div>

      {!isLoading && !error && departments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-bgPrimary/10 p-4">
            <div className="flex items-center gap-2 text-bgPrimaryDark">
              <Layers size={18} />
              <span className="text-sm font-medium">Total Departments</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-bgPrimaryDark">{departments.length}</p>
          </div>

          <div className="rounded-2xl bg-bgPrimary/10 p-4">
            <div className="flex items-center gap-2 text-bgPrimaryDark">
              <Users size={18} />
              <span className="text-sm font-medium">Total Users Assigned</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-bgPrimaryDark">{totalUsers}</p>
          </div>
        </div>
      )}

      {isLoading && <p className="text-center text-sm text-gray-400">Loading departments...</p>}
      {error && <p className="text-center text-sm text-red-500">Failed to load departments</p>}

      {!isLoading && !error && departments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-bgPrimary/30 p-10 text-center">
          <p className="text-sm text-gray-400">
            No departments found. Create your first department.
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <div
            key={dept._id}
            className="group relative rounded-3xl border border-bgPrimary/20 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute inset-x-0 top-0 mx-auto h-1 w-[95%] rounded-t-3xl bg-linear-to-r from-bgPrimaryDark to-bgPrimary" />

            {/* Action Buttons - Top Right */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                onClick={() => setEditDepartment(dept)}
                className="p-2 rounded-lg text-bgPrimaryDark hover:bg-bgPrimary/20 transition"
                title="Edit department"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteDepartment(dept)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                title="Delete department"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-bgPrimaryDark pr-20">{dept.name}</h3>
              {/* <span className="flex items-center gap-1 rounded-full bg-bgPrimary/15 px-3 py-1 text-xs font-medium text-bgPrimaryDark">
                <Users size={14} />
                {dept.totalUsers}
              </span> */}
            </div>

            {dept.description && (
              <p className="mb-4 line-clamp-2 text-sm text-gray-500">{dept.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {dept.users.length === 0 && (
                <span className="text-xs text-gray-400">No users assigned</span>
              )}

              {dept.users.slice(0, 6).map((user) => (
                <span
                  key={user._id}
                  className="rounded-full bg-bgPrimary/20 px-3 py-1 text-xs font-medium text-bgPrimaryDark"
                >
                  {user.name}
                </span>
              ))}

              {dept.users.length > 6 && (
                <span className="text-xs text-gray-400">+{dept.users.length - 6} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE DEPARTMENT MODAL */}
      {showAddModal && (
        <DepartmentForm onCancel={() => setShowAddModal(false)} refetchData={refetch} />
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editDepartment && (
        <DepartmentForm
          department={editDepartment}
          onCancel={() => setEditDepartment(null)}
          refetchData={refetch}
        />
      )}

      {/* DELETE DEPARTMENT MODAL */}
      {deleteDepartment && (
        <DeleteDepartmentModal
          departmentName={deleteDepartment.name}
          onConfirm={() => handleDeleteDepartment(deleteDepartment._id)}
          onCancel={() => setDeleteDepartment(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default Department;
