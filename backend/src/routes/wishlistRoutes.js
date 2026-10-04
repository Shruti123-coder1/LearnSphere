const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/", getWishlist);
router.post("/:courseId", addToWishlist);
router.delete("/:courseId", removeFromWishlist);

module.exports = router;