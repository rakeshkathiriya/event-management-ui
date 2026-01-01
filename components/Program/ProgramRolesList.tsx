"use client";

import { useGetRolesByProgram } from "@/queries/programDepartmentRole/programDepartmentRole";
import "quill/dist/quill.snow.css";

interface ProgramRolesListProps {
  programId: string;
}

const ProgramRolesList = ({ programId }: ProgramRolesListProps) => {
  const { data, isLoading, error } = useGetRolesByProgram(programId);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading roles...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load roles
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No roles defined for this program
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-bgPrimaryDark">
        Department Roles
      </h3>

      {data.data.map((role) => {
        const departmentName =
          typeof role.departmentId === "string"
            ? "Unknown Department"
            : role.departmentId.name;

        return (
          <div
            key={role._id}
            className="rounded-xl border border-bgPrimary/30 bg-white p-4"
          >
            {/* Department Name Header */}
            <div className="mb-3 flex items-center gap-2 border-b border-bgPrimary/20 pb-2">
              <div className="rounded-full bg-bgPrimary/10 px-3 py-1">
                <span className="text-sm font-medium text-bgPrimaryDark">
                  {departmentName}
                </span>
              </div>
            </div>

            {/* Role Description */}
            <div
              className="ql-editor prose max-w-none"
              dangerouslySetInnerHTML={{ __html: role.roleDescription }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProgramRolesList;
