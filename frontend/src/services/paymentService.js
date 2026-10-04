import api from "./api";

export const submitPayment = (courseId, transactionId) =>
  api.post("/payments", { courseId, transactionId }).then((r) => r.data);

export const getMyPayments = () => api.get("/payments/my").then((r) => r.data);