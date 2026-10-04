const express = require("express");
const {
  enroll,
  getMyEnrollments,
  getEnrollmentStatus,
  getLearningData,
  saveProgress,
  getCertificate,
  generateCertificate,
} = require("../controllers/enrollmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("student"));

router.post("/", enroll);
router.get("/my", getMyEnrollments);
router.get("/status/:courseId", getEnrollmentStatus);
router.get("/learn/:courseId", getLearningData);
router.post("/progress", saveProgress);
router.get("/certificate/:courseId", getCertificate);
router.post("/certificate/:courseId", generateCertificate);

module.exports = router;