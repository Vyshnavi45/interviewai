
// models/QuestionResult.js
// Stores result for each question in a test

const mongoose = require("mongoose");

const questionResultSchema = new mongoose.Schema(
  {
    // Which test session this belongs to
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSession",
      required: true,
    },

    // Which user answered this
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The question text
    questionText: {
      type: String,
      required: true,
    },

    // Question number (1-10)
    questionNumber: {
      type: Number,
      required: true,
    },

    // User's answer (converted from voice)
    userAnswer: {
      type: String,
      default: "",
    },

    // Score for this question (0-100)
    score: {
      type: Number,
      default: 0,
    },

    // What user got right
    whatYouGotRight: {
      type: String,
      default: "",
    },

    // What user missed
    whatYouMissed: {
      type: String,
      default: "",
    },

    // AI suggested better answer
    aiBetterAnswer: {
      type: String,
      default: "",
    },

    // Study links (CS only, case 4)
    /*studyLinks: [
      {
        type: String,
      },
    ],*/

    studyLinks: [
  {
    title: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
    },
  },
],
    // Time taken to answer (seconds)
    timeTaken: {
      type: Number,
      default: 0,
    },

    // Time limit for this question (seconds)
    timeLimit: {
      type: Number,
      default: 240,
    },

    // Reading time taken (seconds)
    readingTimeTaken: {
      type: Number,
      default: 0,
    },

    // Question status
    // submitted = answered within time
    // skipped = skipped during reading
    // timedout-partial = timeout with answer
    // timedout-nothing = timeout no answer
    status: {
      type: String,
      enum: [
        "submitted",
        "skipped",
        "timedout-partial",
        "timedout-nothing",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionResult", questionResultSchema);