const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const getToken = (req) => {
  const header = req.headers.authorization;
  return header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
};

// Requires a valid login token. Sets req.user.
const protect = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    res.status(401);
    throw new Error("Not authorized. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Your session has expired. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("This account no longer exists.");
  }

  req.user = user;
  next();
});

// Sets req.user when a valid token is sent, but never blocks the request.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch {
      // ignore invalid token on public routes
    }
  }
  next();
});

// Allows only the given roles. Use after protect.
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error("You do not have permission to do this."));
    }
    next();
  };

module.exports = { protect, optionalAuth, authorize };