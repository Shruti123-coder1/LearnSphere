import api from "./api";

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const put = (url, body) => api.put(url, body).then((r) => r.data);
const del = (url) => api.delete(url).then((r) => r.data);

// Public
export const getCourses = (params) => get("/courses", params);
export const getCourse = (id) => get(`/courses/${id}`);
export const getCategories = () => get("/categories");

// Instructor
export const getMyCourses = () => get("/courses/instructor/mine");
export const createCourse = (data) => post("/courses", data);
export const updateCourse = (id, data) => put(`/courses/${id}`, data);
export const deleteCourse = (id) => del(`/courses/${id}`);
export const submitCourse = (id) => post(`/courses/${id}/submit`);
export const addSection = (courseId, data) =>
  post(`/courses/${courseId}/sections`, data);
export const deleteSection = (courseId, sectionId) =>
  del(`/courses/${courseId}/sections/${sectionId}`);
export const addLesson = (courseId, sectionId, data) =>
  post(`/courses/${courseId}/sections/${sectionId}/lessons`, data);
export const deleteLesson = (courseId, sectionId, lessonId) =>
  del(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);

// Reviews
export const getCourseReviews = (courseId) => get(`/reviews/course/${courseId}`);
export const addReview = (courseId, data) =>
  post(`/reviews/course/${courseId}`, data);

// Wishlist
export const getWishlist = () => get("/wishlist");
export const addToWishlist = (courseId) => post(`/wishlist/${courseId}`);
export const removeFromWishlist = (courseId) => del(`/wishlist/${courseId}`);

// Quiz
export const getQuiz = (courseId) => get(`/quizzes/course/${courseId}`);
export const createQuiz = (courseId, data) =>
  post(`/quizzes/course/${courseId}`, data);
export const submitQuiz = (quizId, answers) =>
  post(`/quizzes/${quizId}/submit`, { answers });
export const getQuizResults = (courseId) =>
  get(`/quizzes/course/${courseId}/results`);