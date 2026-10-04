import api from "./api";

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const patch = (url, body) => api.patch(url, body).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

export const getAdminStats = () => get("/admin/stats");
export const getUsers = () => get("/admin/users");
export const updateUserRole = (id, role) => patch(`/admin/users/${id}/role`, { role });
export const getAdminCourses = (status) => get("/admin/courses", { status });
export const setCourseStatus = (id, status) =>
  patch(`/admin/courses/${id}/status`, { status });
export const getAdminPayments = (status) => get("/admin/payments", { status });
export const setPaymentStatus = (id, status) =>
  patch(`/admin/payments/${id}`, { status });
export const createCategory = (name) => post("/admin/categories", { name });
export const deleteCategory = (id) => del(`/admin/categories/${id}`);