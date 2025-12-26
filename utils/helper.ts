import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "./types/auth";
import { ApiErrorResponse, CommonApiError } from "./types/common";

export const handleErrorResponse = <T = null>(error: CommonApiError): ApiErrorResponse<T> => {
  const apiError = error.response?.data?.error;
  const errors = error?.response?.data?.errors;

  return {
    message: apiError?.message ?? error.message ?? "Unknown error occurred",
    status: false,
    data: (apiError?.data ?? null) as T,
    errors,
  };
};

export const getUserRole = () => {
  const token = localStorage.getItem("accessToken");

  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.role || null;
  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("accessToken");

  if (!token) return null;

  try {
    // Optional: validate token format (JWT has 3 parts)
    const isValidJwt = token.split(".").length === 3;
    if (!isValidJwt) return null;

    return token;
  } catch (error) {
    console.error("Invalid Token:", error);
    return null;
  }
};
