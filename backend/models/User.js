// models/User.js
// Defines how a User is stored in MongoDB

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Full name of user
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique username for login
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Hashed password
    password: {
      type: String,
      required: true,
    },

    // Phone number
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  // Automatically adds createdAt and updatedAt
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);