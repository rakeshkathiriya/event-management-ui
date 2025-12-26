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
    console.log("Request Sent To:", config.url);
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(" Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(" Response Received:", response.status);
    return response;
  },
  async (error: AxiosError) => {
    if (error?.response && error?.response?.status === 401) {
      localStorage.clear();
      globalThis.window.location.href = "/";
    }
    console.error(" Request Error:", error);
    throw error instanceof Error ? error : new Error("Request failed");
  }
);

export { api };
