const express = require("express");
const {
  getStats,
  getUsers,
  updateUserRole,
  getAdminCourses,
  setCourseStatus,
  getAdminPayments,
  setPaymentStatus,
  createCategory,
  deleteCategory,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.get("/courses", getAdminCourses);
router.patch("/courses/:id/status", setCourseStatus);
router.get("/payments", getAdminPayments);
router.patch("/payments/:id", setPaymentStatus);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);

module.exports = router;