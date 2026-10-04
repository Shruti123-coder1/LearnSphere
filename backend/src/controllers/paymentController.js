const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

// POST /api/payments   body: { courseId, transactionId }
const submitPayment = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const transactionId = typeof req.body.transactionId === "string" ? req.body.transactionId.trim() : "";

  if (!mongoose.isValidObjectId(courseId)) fail(res, 404, "Course not found");
  if (!/^[A-Za-z0-9]{8,30}$/.test(transactionId)) {
    fail(res, 400, "Enter a valid transaction ID (8 to 30 letters or digits).");
  }

  const course = await Course.findById(courseId);
  if (!course || course.status !== "approved") fail(res, 404, "This course is not available.");
  if (!course.price) fail(res, 400, "This course is free. You can enroll directly.");

  const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (enrolled) fail(res, 400, "You already have access to this course.");

  const pending = await Payment.exists({
    student: req.user._id,
    course: course._id,
    status: "pending",
  });
  if (pending) fail(res, 400, "You already have a payment waiting for verification for this course.");

  const used = await Payment.exists({ transactionId });
  if (used) fail(res, 409, "This transaction ID has already been used.");

  const payment = await Payment.create({
    student: req.user._id,
    course: course._id,
    amount: course.price,
    transactionId,
  });

  res.status(201).json({
    payment,
    message: "Payment submitted. The course unlocks once an admin verifies it.",
  });
});

// GET /api/payments/my
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate("course", "title");
  res.json({ payments });
});

module.exports = { submitPayment, getMyPayments };