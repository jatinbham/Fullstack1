const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtpLogin, signupUser, loginUser, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send-otp", sendOtp);
router.post("/verify-otp-login", verifyOtpLogin);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

module.exports = router;
