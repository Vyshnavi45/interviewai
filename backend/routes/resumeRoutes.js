const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadResume,
  getResume,
  updateResume,
  analyzeResume,
} = require("../controllers/resumeController");

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Routes
router.post("/upload", protect, upload.single("resume"), uploadResume);
router.get("/get", protect, getResume);
router.put("/update", protect, upload.single("resume"), updateResume);
router.post("/analyze", protect, analyzeResume);

module.exports = router;