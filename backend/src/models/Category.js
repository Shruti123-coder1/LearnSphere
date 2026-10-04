const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Category name is too short"],
      maxlength: [50, "Category name is too long"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);