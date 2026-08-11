// models/ResumeAnalysis.js
// Stores resume analysis results

const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    // Which user this analysis belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Resume text used for analysis
    resumeText: {
      type: String,
      required: true,
    },

    // Job description pasted by user
    jobDescription: {
      type: String,
      required: true,
    },

    // ATS match score (0-100)
    atsScore: {
      type: Number,
      required: true,
    },

    // Missing skills/keywords
    skillGaps: [
      {
        type: String,
      },
    ],

    // Suggestions to improve resume
    suggestions: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);