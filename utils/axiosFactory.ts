import axios from "axios";

import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const api: AxiosInstance = axios.create({
  baseURL: `${backendUrl}/ems/`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error?.response && error?.response?.status === 401) {
      localStorage.clear();
      globalThis.window.location.href = "/";
    }
    throw error instanceof Error ? error : new Error("Request failed");
  }
);

export { api };
