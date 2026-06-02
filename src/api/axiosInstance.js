import axios from "axios";
import { API_BASE_URL } from "../config";

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) config.headers["Authorization"] = "Bearer " + token;
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const msg = error?.response?.data?.message || "";
      if (
        msg.toLowerCase().includes("token") ||
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("invalid")
      ) {
        localStorage.removeItem("auth_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;