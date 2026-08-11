// routes/hrRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateHRQuestions,
  submitHRSession,
  getHRSession,
} = require("../controllers/hrController");

// Generate HR questions from resume
router.post("/generate-questions", protect, generateHRQuestions);

// Submit completed session with all answers
router.post("/submit-session", protect, submitHRSession);

// Get session details
router.get("/session/:id", protect, getHRSession);

module.exports = router;