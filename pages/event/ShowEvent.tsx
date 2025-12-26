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
        <div className="text-center text-red-500 py-10">Failed to load program</div>
      </Modal>
    );
  }

  const program = data;

  return (
    <Modal onClose={onClose}>
      <div className="  rounded-xl p-6 w-full max-w-2xl ">
        {/* Close */}

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#044241]">{program.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{program.description}</p>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gray-200 mb-6" />

        {/* Departments */}
        <div>
          <h3 className="text-sm font-semibold text-[#2D6F6D] mb-3">Assigned Departments</h3>

          {program.departments.length === 0 ? (
            <p className="text-sm text-gray-500">No departments assigned</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {program.departments.map((dept: Department) => (
                <div
                  key={dept._id}
                  className="px-4 py-2 rounded-full bg-[#E6F2F1] text-[#044241] text-sm font-medium shadow-sm"
                >
                  {dept.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ShowProgram;
