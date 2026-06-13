const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// In-memory store for OTPs (For production, use Redis or MongoDB)
const otpStore = new Map();

const sendOtp = async (req, res) => {
  const { contact } = req.body;
  if (!contact) {
    return res.status(400).json({ message: "Contact (email/phone) is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(contact, otp);

  console.log(`\n================================`);
  console.log(`🔔 SIMULATED OTP for ${contact}: ${otp}`);
  console.log(`================================\n`);

  res.json({ message: "OTP sent successfully" });
};

const verifyOtpLogin = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP are required" });
  }

  const storedOtp = otpStore.get(phone);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found with this phone number" });
    }

    otpStore.delete(phone);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("OTP login error:", error);
    res.status(500).json({ message: "Server error during OTP login", error: error.message });
  }
};

const signupUser = async (req, res) => {
  const { name, email, phone, password, role, location, otp } = req.body;

  try {
    // Check for missing required fields
    if (!name || !email || !phone || !password || !role || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: "User already exists with this phone number" });
    }

    // Verify OTP
    const contact = phone || email;
    const storedOtp = otpStore.get(contact);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }
    otpStore.delete(contact);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      location,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Signup error:", error);
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} is already registered` });
    }
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server error during signup", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: "Email/phone and password are required" });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email/phone or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email/phone or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      location: req.user.location,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

module.exports = { sendOtp, verifyOtpLogin, signupUser, loginUser, getMe };