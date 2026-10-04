const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [120, "Title is too long"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
    },
    thumbnail: { type: String, trim: true, default: "" },
    category: { type: String, required: [true, "Category is required"], trim: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    duration: { type: String, trim: true, default: "" },
    price: { type: Number, min: [0, "Price cannot be negative"], default: 0 },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },
    // Counters kept up to date by the controllers
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
    lessonCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ instructor: 1 });

module.exports = mongoose.model("Course", courseSchema);