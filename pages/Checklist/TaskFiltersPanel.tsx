"use client";

import { useGetAllUsers } from "@/queries/user/user";
import { useGetDepartments } from "@/queries/department/department";
import { TaskFilters, TaskPriority } from "@/utils/types/task";
import {
  Building,
  Check,
  ChevronDown,
  Flag,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TaskFiltersPanelProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClose: () => void;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
  isLoading?: boolean;
}

function FilterDropdown({
  label,
  icon,
  value,
  options,
  onChange,
  isLoading,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
          value
            ? "bg-bgPrimary/10 border-bgPrimary text-bgPrimary"
            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
        }`}
      >
        {icon}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Clear option */}
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                  !value ? "text-bgPrimary font-medium" : "text-gray-600"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {!value && <Check className="w-4 h-4" />}
                </div>
                All
              </button>

              {/* Options */}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                    value === option.value
                      ? "text-bgPrimary font-medium"
                      : "text-gray-600"
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {value === option.value && <Check className="w-4 h-4" />}
                  </div>
                  {option.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const priorityOptions = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent Priority" },
];

export default function TaskFiltersPanel({
  filters,
  onFiltersChange,
  onClose,
}: TaskFiltersPanelProps) {
  const { data: users, isLoading: usersLoading } = useGetAllUsers();
  const { data: departmentsData, isLoading: departmentsLoading } = useGetDepartments();

  const usersList = users?.data?.users || [];
  const departmentsList = departmentsData?.data?.departments || [];

  const userOptions = usersList.map((user: any) => ({
    value: user._id,
    label: user.name,
  }));

  const departmentOptions = departmentsList.map((dept: any) => ({
    value: dept._id,
    label: dept.name,
  }));

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <div className="bg-gray-50 border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Assignee Filter */}
          <FilterDropdown
            label="Assignee"
            icon={<Users className="w-4 h-4" />}
            value={filters.assigneeId}
            options={userOptions}
            onChange={(value) =>
              onFiltersChange({ ...filters, assigneeId: value })
            }
            isLoading={usersLoading}
          />

          {/* Department Filter */}
          <FilterDropdown
            label="Department"
            icon={<Building className="w-4 h-4" />}
            value={filters.departmentId}
            options={departmentOptions}
            onChange={(value) =>
              onFiltersChange({ ...filters, departmentId: value })
            }
            isLoading={departmentsLoading}
          />

          {/* Priority Filter */}
          <FilterDropdown
            label="Priority"
            icon={<Flag className="w-4 h-4" />}
            value={filters.priority}
            options={priorityOptions}
            onChange={(value) =>
              onFiltersChange({ ...filters, priority: value as TaskPriority })
            }
          />

          {/* Clear All */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-gray-500">Active filters:</span>
          {filters.assigneeId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-bgPrimary/10 text-bgPrimary rounded-full">
              Assignee:{" "}
              {userOptions.find((u) => u.value === filters.assigneeId)?.label}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, assigneeId: undefined })
                }
                className="hover:bg-bgPrimary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.departmentId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-bgPrimary/10 text-bgPrimary rounded-full">
              Department:{" "}
              {
                departmentOptions.find((d) => d.value === filters.departmentId)
                  ?.label
              }
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, departmentId: undefined })
                }
                className="hover:bg-bgPrimary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-bgPrimary/10 text-bgPrimary rounded-full">
              Priority:{" "}
              {
                priorityOptions.find((p) => p.value === filters.priority)?.label
              }
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, priority: undefined })
                }
                className="hover:bg-bgPrimary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-bgPrimary/10 text-bgPrimary rounded-full">
              Search: "{filters.search}"
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, search: undefined })
                }
                className="hover:bg-bgPrimary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
