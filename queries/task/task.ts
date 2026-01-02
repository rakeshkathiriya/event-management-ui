import { api } from "@/utils/axiosFactory";
import { handleErrorResponse } from "@/utils/helper";
import { CommonApiError, CommonNullResponse } from "@/utils/types/common";
import {
  CreateTaskPayload,
  CreateTaskStatusPayload,
  GetTaskBoardResponse,
  GetTaskByIdResponse,
  GetTasksResponse,
  GetTaskStatusesResponse,
  MoveTaskPayload,
  Task,
  TaskColumn,
  TaskFilters,
  TaskStatus,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from "@/utils/types/task";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ============ TASK STATUS QUERIES ============

export const useGetTaskStatuses = () => {
  return useQuery<TaskStatus[], CommonApiError>({
    queryKey: ["taskStatuses"],
    queryFn: async () => {
      try {
        const response = await api.get<GetTaskStatusesResponse>("/task/status");
        return response.data.data.statuses;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
  });
};

export const useCreateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<TaskStatus, CommonApiError, CreateTaskStatusPayload>({
    mutationKey: ["createTaskStatus"],
    mutationFn: async (payload) => {
      try {
        const response = await api.post("/task/status", payload);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<TaskStatus, CommonApiError, { id: string } & UpdateTaskStatusPayload>({
    mutationKey: ["updateTaskStatus"],
    mutationFn: async ({ id, ...payload }) => {
      try {
        const response = await api.patch(`/task/status/${id}`, payload);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useDeleteTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, string>({
    mutationKey: ["deleteTaskStatus"],
    mutationFn: async (statusId) => {
      try {
        const response = await api.delete(`/task/status/${statusId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useReorderTaskStatuses = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, string[]>({
    mutationKey: ["reorderTaskStatuses"],
    mutationFn: async (statusIds) => {
      try {
        const response = await api.post("/task/status/reorder", { statusIds });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useSeedTaskStatuses = () => {
  const queryClient = useQueryClient();

  return useMutation<{ seeded: boolean }, CommonApiError, void>({
    mutationKey: ["seedTaskStatuses"],
    mutationFn: async () => {
      try {
        const response = await api.post("/task/status/seed");
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

// ============ TASK QUERIES ============

export const useGetTasks = (filters?: TaskFilters) => {
  return useQuery<Task[], CommonApiError>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.statusId) params.append("statusId", filters.statusId);
        if (filters?.assigneeId) params.append("assigneeId", filters.assigneeId);
        if (filters?.departmentId) params.append("departmentId", filters.departmentId);
        if (filters?.priority) params.append("priority", filters.priority);
        if (filters?.search) params.append("search", filters.search);

        const response = await api.get<GetTasksResponse>(`/task?${params.toString()}`);
        return response.data.data.tasks;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
  });
};

export const useGetTaskBoard = () => {
  return useQuery<TaskColumn[], CommonApiError>({
    queryKey: ["taskBoard"],
    queryFn: async () => {
      try {
        const response = await api.get<GetTaskBoardResponse>("/task/board");
        return response.data.data.columns;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
  });
};

export const useGetTaskById = (taskId: string | null) => {
  return useQuery<Task, CommonApiError>({
    queryKey: ["task", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      try {
        const response = await api.get<GetTaskByIdResponse>(`/task/${taskId}`);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, CommonApiError, CreateTaskPayload>({
    mutationKey: ["createTask"],
    mutationFn: async (payload) => {
      try {
        const response = await api.post("/task", payload);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, CommonApiError, { id: string } & UpdateTaskPayload>({
    mutationKey: ["updateTask"],
    mutationFn: async ({ id, ...payload }) => {
      try {
        const response = await api.patch(`/task/${id}`, payload);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, string>({
    mutationKey: ["deleteTask"],
    mutationFn: async (taskId) => {
      try {
        const response = await api.delete(`/task/${taskId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, CommonApiError, { id: string } & MoveTaskPayload>({
    mutationKey: ["moveTask"],
    mutationFn: async ({ id, ...payload }) => {
      try {
        const response = await api.patch(`/task/${id}/move`, payload);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};

export const useReorderTasksInColumn = () => {
  const queryClient = useQueryClient();

  return useMutation<CommonNullResponse, CommonApiError, { statusId: string; taskIds: string[] }>({
    mutationKey: ["reorderTasksInColumn"],
    mutationFn: async ({ statusId, taskIds }) => {
      try {
        const response = await api.post(`/task/column/${statusId}/reorder`, { taskIds });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw handleErrorResponse(error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskBoard"] });
    },
  });
};
