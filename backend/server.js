// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "InterviewAI Server is Running!" });
});

// ─────────────────────────────────────
// Routes
// ─────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/resume", require("./routes/resumeRoutes"));
app.use("/api/hr", require("./routes/hrRoutes"));
app.use("/api/cs", require("./routes/csRoutes"));

// More routes added later
// app.use("/api/hr", require("./routes/hrRoutes"));
// app.use("/api/cs", require("./routes/csRoutes"));
app.use("/api/history", require("./routes/historyRoutes"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});