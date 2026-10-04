import api from "./api";

const get = (url) => api.get(url).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);

export const enroll = (courseId) => post("/enrollments", { courseId });
export const getMyEnrollments = () => get("/enrollments/my");
export const getEnrollmentStatus = (courseId) =>
  get(`/enrollments/status/${courseId}`);
export const getLearningData = (courseId) => get(`/enrollments/learn/${courseId}`);
export const saveProgress = (courseId, lessonId, completed) =>
  post("/enrollments/progress", { courseId, lessonId, completed });
export const getCertificate = (courseId) =>
  get(`/enrollments/certificate/${courseId}`);
export const generateCertificate = (courseId) =>
  post(`/enrollments/certificate/${courseId}`);