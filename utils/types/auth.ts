import { CommonResponse } from "./common";

export interface RegisterUserPayload {
  name: string;

  mobile: string;
  password: string;
  role: "User" | "Admin";
}

export interface LoginUserResponse extends CommonResponse {
  data: {
    _id: string;
    name: string;
    mobile: string;
    role: "Admin" | "User";
  };
}

export interface DecodedToken {
  id: string;
  role: string;
  name?: string; // Optional to support old tokens
  exp?: number;
}
