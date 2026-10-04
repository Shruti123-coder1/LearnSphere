const express = require("express");
const {
  getCourses,
  getMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  addSection,
  deleteSection,
  addLesson,
  deleteLesson,
} = require("../controllers/courseController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const instructor = [protect, authorize("instructor")];

// Public
router.get("/", getCourses);

// Instructor (must stay above "/:id")
router.get("/instructor/mine", ...instructor, getMyCourses);

router.get("/:id", optionalAuth, getCourse);

router.post("/", ...instructor, createCourse);
router.put("/:id", ...instructor, updateCourse);
router.delete("/:id", ...instructor, deleteCourse);
router.post("/:id/submit", ...instructor, submitCourse);

router.post("/:id/sections", ...instructor, addSection);
router.delete("/:id/sections/:sectionId", ...instructor, deleteSection);
router.post("/:id/sections/:sectionId/lessons", ...instructor, addLesson);
router.delete("/:id/sections/:sectionId/lessons/:lessonId", ...instructor, deleteLesson);

module.exports = router;