"use client";

import Modal from "@/components/Model";
import { useGetAllUsers } from "@/queries/user/user";
import { useGetDepartments } from "@/queries/department/department";
import {
  useCreateTask,
  useDeleteTask,
  useGetTaskStatuses,
  useUpdateTask,
} from "@/queries/task/task";
import { Task, TaskPriority } from "@/utils/types/task";
import { useFormik } from "formik";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Flag,
  Loader2,
  Trash2,
  Users,
  Building,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";

interface TaskFormModalProps {
  task: Task | null;
  statusId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-gray-500" },
  { value: "medium", label: "Medium", color: "text-blue-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
];

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").min(1, "Title is required"),
  description: Yup.string(),
  statusId: Yup.string().required("Status is required"),
  priority: Yup.string().oneOf(["low", "medium", "high", "urgent"]),
  assigneeId: Yup.string().nullable(),
  departmentId: Yup.string().nullable(),
  dueDate: Yup.string().nullable(),
});

export default function TaskFormModal({
  task,
  statusId,
  onClose,
  onSuccess,
}: TaskFormModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch data from backend
  const { data: users, isLoading: usersLoading } = useGetAllUsers();
  const { data: departmentsData, isLoading: departmentsLoading } = useGetDepartments();
  const { data: statuses, isLoading: statusesLoading } = useGetTaskStatuses();

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const isEditing = !!task;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const formik = useFormik({
    initialValues: {
      title: task?.title || "",
      description: task?.description || "",
      statusId: task?.status._id || statusId,
      priority: task?.priority || "medium",
      assigneeId: task?.assignee?._id || "",
      departmentId: task?.department?._id || "",
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const payload = {
          title: values.title,
          description: values.description,
          statusId: values.statusId,
          priority: values.priority as TaskPriority,
          assigneeId: values.assigneeId || null,
          departmentId: values.departmentId || null,
          dueDate: values.dueDate || null,
        };

        if (isEditing) {
          await updateMutation.mutateAsync({ id: task._id, ...payload });
          toast.success("Task updated successfully");
        } else {
          await createMutation.mutateAsync(payload);
          toast.success("Task created successfully");
        }
        onSuccess();
      } catch (error: any) {
        toast.error(error?.message || "Failed to save task");
      }
    },
  });

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteMutation.mutateAsync(task._id);
      toast.success("Task deleted successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete task");
    }
  };

  const usersList = users?.data?.users || [];
  const departmentsList = departmentsData?.data?.departments || [];

  return (
    <Modal onClose={onClose} isLoading={isLoading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit Task" : "Create Task"}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this task? This action cannot
                  be undone.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter task title..."
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 ${
                formik.touched.title && formik.errors.title
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter task description..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 resize-none"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                name="statusId"
                value={formik.values.statusId}
                onChange={formik.handleChange}
                disabled={statusesLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 bg-white"
              >
                {statuses?.map((status) => (
                  <option key={status._id} value={status._id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Flag className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                name="priority"
                value={formik.values.priority}
                onChange={formik.handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 bg-white"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee & Department Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee - Backend Driven */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Assignee
              </label>
              <select
                name="assigneeId"
                value={formik.values.assigneeId}
                onChange={formik.handleChange}
                disabled={usersLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 bg-white"
              >
                <option value="">Unassigned</option>
                {usersList.map((user: any) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {usersLoading && (
                <p className="text-xs text-gray-400 mt-1">Loading users...</p>
              )}
            </div>

            {/* Department - Backend Driven */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="w-4 h-4 inline mr-1" />
                Department
              </label>
              <select
                name="departmentId"
                value={formik.values.departmentId}
                onChange={formik.handleChange}
                disabled={departmentsLoading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50 bg-white"
              >
                <option value="">No Department</option>
                {departmentsList.map((dept: any) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {departmentsLoading && (
                <p className="text-xs text-gray-400 mt-1">
                  Loading departments...
                </p>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formik.values.dueDate}
              onChange={formik.handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bgPrimary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formik.isValid}
              className="px-4 py-2 text-sm bg-bgPrimary text-white rounded-lg hover:bg-bgPrimaryDark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
