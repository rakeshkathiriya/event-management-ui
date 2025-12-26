export interface CreateProgramPayload {
  title: string;
  description: string;
  departmentIds: string[];
  user?: string[];
}

export interface User {
  _id: string;
  name: string;
}

export interface Department {
  _id: string;
  name: string;
  users: User[];
}

export interface Program {
  _id: string;
  title: string;
  description: string;
  departments: Department[];
}

export interface GetProgramByIdResponse {
  success: boolean;
  data: Program;
}
