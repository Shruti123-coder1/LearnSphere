const express = require("express");
const { getCourseReviews, addReview } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/course/:courseId", getCourseReviews);
router.post("/course/:courseId", protect, authorize("student"), addReview);

module.exports = router;