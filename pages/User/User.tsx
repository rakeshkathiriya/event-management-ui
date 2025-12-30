"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { useGetAllUsers, useDeleteUser } from "@/queries/user/user";
import type { User as UserType } from "@/utils/types/user";
import { useAuth } from "@/hooks/useAuth";
import UserRegistrationForm from "./UserCreationForm";
import DeleteUserModal from "@/components/common/DeleteUserModal";

const User = () => {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState<UserType | null>(null);
  const { data, isLoading, error, refetch } = useGetAllUsers();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const users: UserType[] = data?.data?.users ?? [];

  // Delete handler
  const handleDeleteUser = (userId: string) => {
    deleteUser(userId, {
      onSuccess: (data) => {
        if (data.status) {
          toast.success(data.message ?? "User deleted successfully");
          refetch();
          setDeleteModalUser(null);
        } else {
          toast.error(data.message ?? "Failed to delete user");
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
    <div className="space-y-8 p-6 md:p-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-bgPrimaryDark">Users</h2>
          <p className="text-sm text-gray-500">Manage users and their assigned departments</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          <span>Add User</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mobile</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Departments
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="border-t transition hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>

                  <td className="px-6 py-4 text-gray-600">{user.mobile || "-"}</td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.departments?.length ? (
                        user.departments.map((dept) => (
                          <span
                            key={dept._id}
                            className="rounded-full bg-bgPrimary/20 px-3 py-1 text-xs font-medium text-bgPrimaryDark"
                          >
                            {dept.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No departments</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteModalUser(user)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <UserRegistrationForm onCancel={() => setShowAddModal(false)} refetchData={refetch} />
      )}

      {/* DELETE USER MODAL */}
      {deleteModalUser && (
        <DeleteUserModal
          userName={deleteModalUser.name}
          onConfirm={() => handleDeleteUser(deleteModalUser._id)}
          onCancel={() => setDeleteModalUser(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default User;
