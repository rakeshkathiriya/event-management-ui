import { User } from "./user";

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  users: string[];
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  users: User[];
  totalUsers: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetDepartmentsResponse {
  success: boolean;
  data: {
    departments: Department[];
    totalDepartments: number;
  };
}
