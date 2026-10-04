const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("./config/db");
const app = require("./app");
const User = require("./models/User");
const Category = require("./models/Category");

const DEFAULT_CATEGORIES = [
  "Web Development",
  "Data Science",
  "Programming",
  "UI/UX Design",
  "Cybersecurity",
  "AI & Machine Learning",
  "Cloud & DevOps",
];

// Creates the default categories the first time the server starts.
const seedCategories = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({ name })));
    console.log("Default categories created");
  }
};

// Creates the admin account from .env if it does not exist yet.
const ensureAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const exists = await User.findOne({ email });
  if (exists) return;

  await User.create({
    name: process.env.ADMIN_NAME || "LearnSphere Admin",
    email,
    password,
    role: "admin",
  });
  console.log(`Admin account created: ${email}`);
};

const start = async () => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in backend/.env");
    process.exit(1);
  }

  await connectDB();
  await seedCategories();
  await ensureAdmin();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});