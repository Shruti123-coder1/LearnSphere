const express = require("express");
const {
  getQuiz,
  createQuiz,
  submitQuiz,
  getQuizResults,
} = require("../controllers/quizController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/course/:courseId", protect, getQuiz);
router.post("/course/:courseId", protect, authorize("instructor"), createQuiz);
router.get("/course/:courseId/results", protect, getQuizResults);
router.post("/:quizId/submit", protect, authorize("student"), submitQuiz);

module.exports = router;