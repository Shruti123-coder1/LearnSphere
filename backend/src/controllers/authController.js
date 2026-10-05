const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const str = (v) => (typeof v === "string" ? v.trim() : "");

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  // Only student or instructor can be chosen on sign up. Admin is created from .env
  const role = req.body.role === "instructor" ? "instructor" : "student";

  if (name.length < 2) fail(res, 400, "Name must be at least 2 characters.");
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(res, 400, "Enter a valid email address.");
  if (password.length < 6) fail(res, 400, "Password must be at least 6 characters.");

  const exists = await User.findOne({ email });
  if (exists) fail(res, 409, "An account with this email already exists.");

  const user = await User.create({ name, email, password, role });

  res.status(201).json({ token: generateToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) fail(res, 400, "Please enter your email and password.");

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    fail(res, 401, "Invalid email or password.");
  }

  res.json({ token: generateToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/profile   body: { name, email }
const updateProfile = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();

  if (name.length < 2) fail(res, 400, "Name must be at least 2 characters.");
  if (name.length > 60) fail(res, 400, "Name is too long.");
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(res, 400, "Enter a valid email address.");

  const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
  if (taken) fail(res, 409, "This email is already used by another account.");

  const user = await User.findById(req.user._id);
  if (!user) fail(res, 404, "Account not found.");

  user.name = name;
  user.email = email;
  await user.save();

  res.json({ user: publicUser(user), message: "Profile updated." });
});

// PUT /api/auth/password   body: { currentPassword, newPassword }
const changePassword = asyncHandler(async (req, res) => {
  const currentPassword =
    typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

  if (!currentPassword) fail(res, 400, "Enter your current password.");
  if (newPassword.length < 6) fail(res, 400, "New password must be at least 6 characters.");
  if (newPassword === currentPassword) {
    fail(res, 400, "New password must be different from the current password.");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) fail(res, 404, "Account not found.");

  const ok = await user.matchPassword(currentPassword);
  if (!ok) fail(res, 400, "Current password is incorrect.");

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password changed successfully." });
});

module.exports = { register, login, getMe, updateProfile, changePassword };