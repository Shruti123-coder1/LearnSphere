const express = require("express");
const { submitPayment, getMyPayments } = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("student"));

router.post("/", submitPayment);
router.get("/my", getMyPayments);

module.exports = router;