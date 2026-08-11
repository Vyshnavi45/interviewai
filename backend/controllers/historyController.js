// controllers/historyController.js
const TestSession = require("../models/TestSession");
const QuestionResult = require("../models/QuestionResult");

// ─────────────────────────────────────
// GET HR HISTORY
// GET /api/history/hr
// ─────────────────────────────────────
const getHRHistory = async (req, res) => {
  try {
    // Get all HR sessions for user
    const sessions = await TestSession.find({
      userId: req.user._id,
      feature: "HR",}).sort({ createdAt: -1 });

    // Separate parent sessions and retakes
    const parentSessions = sessions.filter(
      (s) => !s.parentSessionId
    );

    const result = parentSessions.map((parent) => {
      // Find retakes for this parent
      const retakes = sessions.filter(
        (s) =>
          s.parentSessionId?.toString() ===
          parent._id.toString()
      );

      return {
        ...parent.toObject(),
        retakes,
      };
    });

    res.status(200).json({
      message: "HR history fetched",
      sessions: result,
    });

  } catch (error) {
    console.error("Get HR history error:", error);
    res.status(500).json({
      message: "Error fetching HR history",
    });
  }
};

// ─────────────────────────────────────
// GET CS HISTORY
// GET /api/history/cs
// ─────────────────────────────────────
const getCSHistory = async (req, res) => {
  try {
    // ✅ Only fetch sessions with valid CS topics
    const sessions = await TestSession.find({
      userId: req.user._id,
      feature: "CS",
    }).sort({ createdAt: -1 });

    const parentSessions = sessions.filter(
      (s) => !s.parentSessionId
    );

    const result = parentSessions.map((parent) => {
      const retakes = sessions.filter(
        (s) =>
          s.parentSessionId?.toString() ===
          parent._id.toString()
      );
      return {
        ...parent.toObject(),
        retakes,
      };
    });

    res.status(200).json({
      message: "CS history fetched",
      sessions: result,
    });

  } catch (error) {
    console.error("Get CS history error:", error);
    res.status(500).json({
      message: "Error fetching CS history",
    });
  }
};

module.exports = { getHRHistory, getCSHistory };