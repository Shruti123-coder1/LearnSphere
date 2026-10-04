export const APP_NAME = "LearnSphere";

export const CATEGORIES = [
  "All",
  "Web Development",
  "Data Science",
  "Programming",
  "UI/UX Design",
  "Cybersecurity",
  "AI & Machine Learning",
  "Cloud & DevOps",
];

export const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export const formatPrice = (price) =>
  !price ? "Free" : `₹${Number(price).toLocaleString("en-IN")}`;