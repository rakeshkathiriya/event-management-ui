"use client";

import Modal from "@/components/Model";
import { useGetProgramById } from "@/queries/program/program";
import { Department } from "@/utils/types/department";

interface ShowProgramProps {
  programId: string;
  onClose: () => void;
}

const ShowProgram = ({ programId, onClose }: ShowProgramProps) => {
  const { data, isLoading, isError } = useGetProgramById(programId);

  if (isLoading) {
    return (
      <Modal onClose={onClose}>
        <div className="flex items-center justify-center py-10 text-gray-600">
          Loading program...
        </div>
      </Modal>
    );
  }

  if (isError || !data) {
    return (
      <Modal onClose={onClose}>
        <div className="py-10 text-center text-red-500">Failed to load program</div>
      </Modal>
    );
  }

  const program = data;

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 sm:p-8">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#044241] mb-4">{program.title}</h2>

        {/* Description (React-Quill HTML) */}
        <div
          className="program-description"
          dangerouslySetInnerHTML={{ __html: program.description }}
        />
        {/* Divider */}
        <div className="my-8 h-px bg-gray-200" />

        {/* Departments */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#2D6F6D]">
            Assigned Departments
          </h3>

          {program.departments.length === 0 ? (
            <p className="text-sm text-gray-500">No departments assigned</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {program.departments.map((dept: Department) => (
                <span
                  key={dept._id}
                  className="rounded-full bg-[#E6F2F1] px-4 py-2 text-sm font-medium text-[#044241]"
                >
                  {dept.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ShowProgram;
