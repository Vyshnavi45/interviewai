// routes/csRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateCSQuestions,
  submitCSSession,
  getCSSession,
  getAITime,
} = require("../controllers/csController");

// Generate CS questions by topic
router.post(
  "/generate-questions",
  protect,
  generateCSQuestions
);

// Get AI time for question
router.post("/get-time", protect, getAITime);

// Submit CS session
router.post("/submit-session", protect, submitCSSession);

// Get CS session
router.get("/session/:id", protect, getCSSession);

module.exports = router;