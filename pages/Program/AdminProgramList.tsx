"use client";

import { BookOpen, Eye, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { useGetPrograms, useDeleteProgram } from "@/queries/program/program";
import { useAuth } from "@/hooks/useAuth";
import { Program, Department } from "@/utils/types/program";
import DescriptionModal from "@/components/common/DescriptionModal";
import DeleteProgramModal from "@/components/common/DeleteProgramModal";
import ProgramForm from "./ProgramForm";

const AdminProgramList = () => {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [deleteProgram, setDeleteProgram] = useState<Program | null>(null);
  const { data, isLoading, error, refetch } = useGetPrograms();
  const { mutate: deleteProg, isPending: isDeleting } = useDeleteProgram();

  const programs = data?.programs ?? [];
  const totalPrograms = data?.total ?? 0;

  const handleDeleteProgram = (progId: string) => {
    deleteProg(progId, {
      onSuccess: (data) => {
        if (data.status) {
          toast.success(data.message ?? "Program deleted successfully");
          refetch();
          setDeleteProgram(null);
        } else {
          toast.error(data.message ?? "Failed to delete program");
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
      router.replace("/main/home");
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
          <h2 className="text-3xl font-bold tracking-tight text-bgPrimaryDark">Programs</h2>
          <p className="mt-1 text-sm text-gray-500">Manage all programs and their assignments</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, #044241 0%, #2D6F6D 100%)" }}
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          <span>Create Program</span>
        </button>
      </div>

      {!isLoading && !error && programs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-bgPrimary/10 p-4">
            <div className="flex items-center gap-2 text-bgPrimaryDark">
              <BookOpen size={18} />
              <span className="text-sm font-medium">Total Programs</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-bgPrimaryDark">{totalPrograms}</p>
          </div>

          <div className="rounded-2xl bg-bgPrimary/10 p-4">
            <div className="flex items-center gap-2 text-bgPrimaryDark">
              <Layers size={18} />
              <span className="text-sm font-medium">Departments Assigned</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-bgPrimaryDark">
              {programs.reduce((sum: number, p: Program) => sum + (p.departments?.length ?? 0), 0)}
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-bgPrimary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Failed to load programs. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && programs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-bgPrimary/30 p-10 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-bgPrimary/40" />
          <p className="text-sm text-gray-400">
            No programs found. Create your first program to get started.
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program: Program) => (
          <div
            key={program._id}
            className="group relative rounded-3xl border border-bgPrimary/20 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute inset-x-0 top-0 mx-auto h-1 w-[95%] rounded-t-3xl bg-linear-to-r from-bgPrimaryDark to-bgPrimary" />

            {/* Action Buttons - Top Right */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                onClick={() => setEditProgram(program)}
                className="p-2 rounded-lg text-bgPrimaryDark hover:bg-bgPrimary/20 transition"
                title="Edit program"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteProgram(program)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                title="Delete program"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-bgPrimaryDark line-clamp-2 pr-20">
                {program.title}
              </h3>
            </div>

            {program.description && (
              <div
                className="mb-4 line-clamp-3 text-sm text-gray-500 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: program.description.replace(/<[^>]*>/g, (match: string) =>
                    match.startsWith("</") ? " " : ""
                  ),
                }}
              />
            )}

            {program.departments && program.departments.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bgPrimary">
                  Assigned Departments
                </p>
                <div className="flex flex-wrap gap-2">
                  {program.departments.slice(0, 3).map((dept: Department) => (
                    <span
                      key={dept._id}
                      className="rounded-full bg-bgPrimary/20 px-3 py-1 text-xs font-medium text-bgPrimaryDark"
                    >
                      {dept.name}
                    </span>
                  ))}
                  {program.departments.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{program.departments.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedProgram(program)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-bgPrimary/30 bg-bgPrimary/5 px-4 py-2 text-sm font-medium text-bgPrimaryDark transition-all hover:bg-bgPrimary/10"
            >
              <Eye size={16} />
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <ProgramForm
          onCancel={() => setShowAddModal(false)}
          refetchData={refetch}
        />
      )}

      {/* EDIT MODAL */}
      {editProgram && (
        <ProgramForm
          program={editProgram}
          onCancel={() => setEditProgram(null)}
          refetchData={refetch}
        />
      )}

      {/* DELETE MODAL */}
      {deleteProgram && (
        <DeleteProgramModal
          programTitle={deleteProgram.title}
          onConfirm={() => handleDeleteProgram(deleteProgram._id)}
          onCancel={() => setDeleteProgram(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedProgram && (
        <DescriptionModal
          title={selectedProgram.title}
          description={selectedProgram.description}
          departments={selectedProgram.departments as any}
          programId={selectedProgram._id}
          onClose={() => setSelectedProgram(null)}
          onRoleUpdate={refetch}
        />
      )}
    </div>
  );
};

export default AdminProgramList;
