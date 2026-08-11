
// models/TestSession.js
// Stores each test attempt (HR or CS)

const mongoose = require("mongoose");

const testSessionSchema = new mongoose.Schema(
  {
    // Which user took this test
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // HR or CS
    feature: {
      type: String,
      enum: ["HR", "CS"],
      required: true,
    },

    // Topic for CS quiz (DBMS, CN, OOPs, OS)
    topic: {
      type: String,
      enum: ["DBMS", "CN", "OOPs", "OS", "NA"],
      default: "NA",
    },

    // Timer or No Timer mode
    mode: {
      type: String,
      enum: ["timer", "notimer"],
      required: true,
    },

    // Array of questions for this session
    // Saved so retakes use same questions
    questions: [
      {
        type: String,
      },
    ],

    // Total number of questions (8-12)
    totalQuestions: {
      type: Number,
      required: true,
    },

    // Final score out of 100
    totalScore: {
      type: Number,
      default: 0,
    },

    // Attempt number (1, 2, 3)
    attemptNumber: {
      type: Number,
      default: 1,
    },

    // How many retakes used (0, 1, 2)
    retakesUsed: {
      type: Number,
      default: 0,
    },

    // Max retakes allowed
    maxRetakes: {
      type: Number,
      default: 2,
    },

    // Can user retake this test?
    canRetake: {
      type: Boolean,
      default: true,
    },

    // Links to parent session for retakes
    parentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSession",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestSession", testSessionSchema);