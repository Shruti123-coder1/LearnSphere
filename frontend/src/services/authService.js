import api from "./api";

export const registerUser = (data) =>
  api.post("/auth/register", data).then((r) => r.data);

export const loginUser = (data) =>
  api.post("/auth/login", data).then((r) => r.data);

export const fetchMe = () => api.get("/auth/me").then((r) => r.data);

export const updateProfile = (data) =>
  api.put("/auth/profile", data).then((r) => r.data);

export const changePassword = (data) =>
  api.put("/auth/password", data).then((r) => r.data);