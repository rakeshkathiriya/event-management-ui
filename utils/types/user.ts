export interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: "User" | "Admin";
  departments?: {
    _id: string;
    name: string;
  }[];
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
  };
}
