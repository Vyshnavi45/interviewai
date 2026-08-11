// routes/historyRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getHRHistory,
  getCSHistory,
} = require("../controllers/historyController");

// Get all HR sessions for user
router.get("/hr", protect, getHRHistory);

// Get all CS sessions for user
router.get("/cs", protect, getCSHistory);

module.exports = router;