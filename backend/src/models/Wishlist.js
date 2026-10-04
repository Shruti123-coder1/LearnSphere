const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

wishlistSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);