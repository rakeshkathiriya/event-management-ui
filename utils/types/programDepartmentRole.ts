import { Department } from './department';

export interface ProgramDepartmentRole {
  _id: string;
  programId: string;
  departmentId: string | Department;
  roleDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  programId: string;
  departmentId: string;
  roleDescription: string;
}

export interface UpdateRolePayload {
  roleDescription: string;
}

export interface GetRolesByProgramResponse {
  status: boolean;
  message: string;
  data: ProgramDepartmentRole[];
}

export interface CreateRoleResponse {
  status: boolean;
  message: string;
  data: ProgramDepartmentRole;
}

export interface UpdateRoleResponse {
  status: boolean;
  message: string;
  data: ProgramDepartmentRole;
}

export interface DeleteRoleResponse {
  status: boolean;
  message: string;
  data: null;
}
