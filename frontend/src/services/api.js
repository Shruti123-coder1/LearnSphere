import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ls_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("ls_token")) {
      localStorage.removeItem("ls_token");
      localStorage.removeItem("ls_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const getErrorMessage = (err, fallback = "Something went wrong") => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err.response) {
    return "Cannot reach the server. Please make sure the backend is running.";
  }
  return fallback;
};

export default api;