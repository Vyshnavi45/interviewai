
// models/Resume.js
// Stores user's uploaded resume

const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    // Which user this resume belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Extracted text from PDF
    resumeText: {
      type: String,
      required: true,
    },

    // Original file name
    fileName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);