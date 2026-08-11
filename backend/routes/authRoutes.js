
// routes/authRoutes.js
// Defines all authentication routes

const express = require("express");
const router = express.Router();
const {
  signup,
  login,
} = require("../controllers/authController");

// POST /api/auth/signup → Create new account
router.post("/signup", signup);

// POST /api/auth/login → Login to account
router.post("/login", login);

module.exports = router;