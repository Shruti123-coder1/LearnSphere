const mongoose = require("mongoose");
const Course = require("../models/Course");
const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../utils/asyncHandler");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "course",
      match: { status: "approved" },
      populate: { path: "instructor", select: "name" },
    });

  res.json({ courses: items.map((i) => i.course).filter(Boolean) });
});

// POST /api/wishlist/:courseId
const addToWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) fail(res, 404, "Course not found");

  const course = await Course.findById(courseId);
  if (!course || course.status !== "approved") fail(res, 404, "This course is not available.");

  await Wishlist.updateOne(
    { student: req.user._id, course: course._id },
    { $setOnInsert: { addedAt: new Date() } },
    { upsert: true }
  );

  res.status(201).json({ message: "Added to wishlist." });
});

// DELETE /api/wishlist/:courseId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) fail(res, 404, "Course not found");

  await Wishlist.deleteOne({ student: req.user._id, course: courseId });
  res.json({ message: "Removed from wishlist." });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };