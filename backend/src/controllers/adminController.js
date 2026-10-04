const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Payment = require("../models/Payment");
const Category = require("../models/Category");
const asyncHandler = require("../utils/asyncHandler");

const ROLES = ["student", "instructor", "admin"];
const COURSE_STATUSES = ["draft", "pending", "approved", "rejected"];
const PAYMENT_STATUSES = ["pending", "verified", "rejected"];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const checkId = (res, id, message = "Resource not found") => {
  if (!mongoose.isValidObjectId(id)) fail(res, 404, message);
};

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [
    users,
    students,
    instructors,
    courses,
    enrollments,
    pendingCourses,
    pendingPayments,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "instructor" }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Course.countDocuments({ status: "pending" }),
    Payment.countDocuments({ status: "pending" }),
    Payment.aggregate([
      { $match: { status: "verified" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    stats: {
      users,
      students,
      instructors,
      courses,
      enrollments,
      revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
      pendingCourses,
      pendingPayments,
    },
  });
});

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
});

// PATCH /api/admin/users/:id/role   body: { role }
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  checkId(res, id, "User not found");
  if (!ROLES.includes(role)) fail(res, 400, "Invalid role.");
  if (String(id) === String(req.user._id)) fail(res, 400, "You cannot change your own role.");

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) fail(res, 404, "User not found");

  res.json({ user });
});

// GET /api/admin/courses?status=pending|approved|rejected|draft|all
const getAdminCourses = asyncHandler(async (req, res) => {
  const filter = {};
  const { status } = req.query;
  if (typeof status === "string" && COURSE_STATUSES.includes(status)) filter.status = status;

  const courses = await Course.find(filter)
    .sort({ createdAt: -1 })
    .populate("instructor", "name email");

  res.json({ courses });
});

// PATCH /api/admin/courses/:id/status   body: { status }
const setCourseStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  checkId(res, id, "Course not found");
  if (!COURSE_STATUSES.includes(status)) fail(res, 400, "Invalid course status.");

  const course = await Course.findById(id);
  if (!course) fail(res, 404, "Course not found");

  course.status = status;
  await course.save();
  await course.populate("instructor", "name email");

  res.json({ course });
});

// GET /api/admin/payments?status=pending|verified|rejected
const getAdminPayments = asyncHandler(async (req, res) => {
  const filter = {};
  const { status } = req.query;
  if (typeof status === "string" && PAYMENT_STATUSES.includes(status)) filter.status = status;

  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .populate("student", "name email")
    .populate("course", "title");

  res.json({ payments });
});

// PATCH /api/admin/payments/:id   body: { status }
// verified -> enrolls the student. Moving away from verified removes the access again.
const setPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  checkId(res, id, "Payment not found");
  if (!PAYMENT_STATUSES.includes(status)) fail(res, 400, "Invalid payment status.");

  const payment = await Payment.findById(id);
  if (!payment) fail(res, 404, "Payment not found");

  const previous = payment.status;

  if (previous !== status) {
    if (status === "verified") {
      const course = await Course.findById(payment.course);
      if (!course) fail(res, 404, "The course for this payment no longer exists.");

      const result = await Enrollment.updateOne(
        { student: payment.student, course: payment.course },
        { $setOnInsert: { enrolledAt: new Date() } },
        { upsert: true }
      );
      if (result.upsertedCount) {
        await Course.updateOne({ _id: payment.course }, { $inc: { enrolledCount: 1 } });
      }
    } else if (previous === "verified") {
      const removed = await Enrollment.deleteOne({
        student: payment.student,
        course: payment.course,
      });
      if (removed.deletedCount) {
        await Course.updateOne({ _id: payment.course }, { $inc: { enrolledCount: -1 } });
      }
    }

    payment.status = status;
    payment.verifiedBy = status === "pending" ? undefined : req.user._id;
    payment.verifiedAt = status === "pending" ? undefined : new Date();
    await payment.save();
  }

  res.json({ payment });
});

// POST /api/admin/categories   body: { name }
const createCategory = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2) fail(res, 400, "Category name is too short.");
  if (name.length > 50) fail(res, 400, "Category name is too long.");

  const exists = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });
  if (exists) fail(res, 409, "This category already exists.");

  const category = await Category.create({ name });
  res.status(201).json({ category });
});

// DELETE /api/admin/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  checkId(res, id, "Category not found");

  const category = await Category.findById(id);
  if (!category) fail(res, 404, "Category not found");

  const inUse = await Course.exists({ category: category.name });
  if (inUse) fail(res, 400, "Courses are using this category, so it cannot be deleted.");

  await category.deleteOne();
  res.json({ message: "Category deleted." });
});

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  getAdminCourses,
  setCourseStatus,
  getAdminPayments,
  setPaymentStatus,
  createCategory,
  deleteCategory,
};