// src/utils/courseImages.js
// Course thumbnail helper.
// 1) Uses the thumbnail link saved with the course (instructor/backend).
// 2) If missing, uses a related image for the course category.
// 3) If everything fails, the UI shows a coloured icon fallback.

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

export const CATEGORY_IMAGES = {
  "Web Development": img("photo-1633356122544-f134324a6cee"),
  "Data Science": img("photo-1551288049-bebda4e38f71"),
  Programming: img("photo-1627398242454-45a1465c2479"),
  "UI/UX Design": img("photo-1561070791-2526d30994b5"),
  Cybersecurity: img("photo-1550751827-4bd374c3f58b"),
  "AI & Machine Learning": img("photo-1677442136019-21780ecad995"),
  "Cloud & DevOps": img("photo-1558494949-ef010cbdcc31"),
};

export const DEFAULT_IMAGE = img("photo-1522202176988-66273c2fd55f");

export const getCategoryImage = (course) =>
  CATEGORY_IMAGES[course?.category] || DEFAULT_IMAGE;

export const getCourseImage = (course) =>
  (course?.thumbnail || "").trim() || getCategoryImage(course);