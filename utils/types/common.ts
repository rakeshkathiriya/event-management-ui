import type { AxiosError } from "axios";

export interface CommonNullResponse extends CommonResponse {
  data: null;
}

export interface CommonResponse {
  status: boolean;
  message: string;
  accessToken?: string;
  pagination?: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export type CommonApiError<T = unknown> = AxiosError<{
  error?: {
    message?: string;
    status?: boolean;
    statusCode?: number;
    data?: T | null;
  };
  errors?: string[];
}>;

export interface ApiErrorResponse<T = null> {
  status: boolean;
  message: string | string[];
  errors?: string[] | [];
  data: T | null;
}
