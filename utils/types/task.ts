export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskStatus {
  _id: string;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskAssignee {
  _id: string;
  name: string;
}

export interface TaskDepartment {
  _id: string;
  name: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TaskAssignee;
  department?: TaskDepartment;
  dueDate?: string;
  order: number;
  createdBy: TaskAssignee;
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
  status: TaskStatus;
  tasks: Task[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  statusId: string;
  priority?: TaskPriority;
  assigneeId?: string;
  departmentId?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  statusId?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  departmentId?: string | null;
  dueDate?: string | null;
}

export interface MoveTaskPayload {
  targetStatusId: string;
  newOrder: number;
}

export interface CreateTaskStatusPayload {
  name: string;
  color: string;
  order?: number;
}

export interface UpdateTaskStatusPayload {
  name?: string;
  color?: string;
  order?: number;
}

// API Response Types
export interface GetTaskStatusesResponse {
  status: boolean;
  data: {
    statuses: TaskStatus[];
    total: number;
  };
}

export interface GetTasksResponse {
  status: boolean;
  data: {
    tasks: Task[];
    total: number;
  };
}

export interface GetTaskBoardResponse {
  status: boolean;
  data: {
    columns: TaskColumn[];
  };
}

export interface GetTaskByIdResponse {
  status: boolean;
  data: Task;
}

export interface TaskFilters {
  statusId?: string;
  assigneeId?: string;
  departmentId?: string;
  priority?: TaskPriority;
  search?: string;
}
