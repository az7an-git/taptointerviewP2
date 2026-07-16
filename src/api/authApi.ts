import axios from "axios";
import { storage } from "@/common/utils/storage";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.platform.com/v1",
});

// Axios interceptor to automatically add the JWT token to every request
authApi.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
});

export default authApi;

