const Resume = require("../models/Resume");
const fs = require("fs");
const Groq = require("groq-sdk");
const PDFParser = require("pdf2json");

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────
// Helper: Extract text from PDF
// ─────────────────────────────────────
const extractTextFromPDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) => {
      // Full error object logged so we can see exactly why parsing failed
      console.error("PDF parse error (FULL):", JSON.stringify(errData, null, 2));
      reject(errData.parserError || errData);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        // Extract text from all pages
        let text = "";
        pdfData.Pages.forEach((page) => {
          page.Texts.forEach((textItem) => {
            textItem.R.forEach((r) => {
              let piece;
              try {
                piece = decodeURIComponent(r.T);
              } catch (decodeErr) {
                // Some PDFs contain malformed % sequences (stray % signs,
                // special glyphs, etc.) that break decodeURIComponent.
                // Fall back to the raw string instead of failing the whole extraction.
                piece = r.T;
              }
              text += piece + " ";
            });
          });
          text += "\n";
        });
        console.log("PDF text extracted successfully!");
        resolve(text);
      } catch (error) {
        console.error("PDF text assembly error (FULL):", error);
        reject(error);
      }
    });

    pdfParser.loadPDF(filePath);
  });
};

// ─────────────────────────────────────
// UPLOAD RESUME
// POST /api/resume/upload
// ─────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    console.log("File received:", req.file.originalname);

    // Extract text from PDF
    let resumeText = "";
    let extractionFailed = false;
    try {
      resumeText = await extractTextFromPDF(req.file.path);
      console.log("Resume text length:", resumeText.length);

      // Some PDFs "succeed" but yield empty/near-empty text (e.g. scanned images)
      if (!resumeText || resumeText.trim().length < 10) {
        console.log("Extraction returned little/no text — likely a scanned or image-based PDF.");
        extractionFailed = true;
      }
    } catch (error) {
      console.log("PDF extraction failed:", error.message || error);
      extractionFailed = true;
    }

    if (extractionFailed) {
      resumeText = `Resume: ${req.file.originalname}`;
    }

    // Delete uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Check if user already has resume
    const existingResume = await Resume.findOne({
      userId: req.user._id,
    });

    if (existingResume) {
      existingResume.resumeText = resumeText;
      existingResume.fileName = req.file.originalname;
      await existingResume.save();

      return res.status(200).json({
        message: extractionFailed
          ? "Resume updated, but text could not be extracted (file may be a scanned/image PDF)"
          : "Resume updated successfully",
        resume: {
          id: existingResume._id,
          fileName: existingResume.fileName,
          resumeText: resumeText.substring(0, 200),
        },
      });
    }

    // Save new resume
    const newResume = new Resume({
      userId: req.user._id,
      resumeText,
      fileName: req.file.originalname,
    });

    await newResume.save();
    console.log("Resume saved to MongoDB!");

    res.status(201).json({
      message: extractionFailed
        ? "Resume uploaded, but text could not be extracted (file may be a scanned/image PDF)"
        : "Resume uploaded successfully",
      resume: {
        id: newResume._id,
        fileName: newResume.fileName,
        resumeText: resumeText.substring(0, 200),
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({
      message: "Error uploading resume: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// GET RESUME
// GET /api/resume/get
// ─────────────────────────────────────
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "No resume found",
      });
    }

    res.status(200).json({
      message: "Resume fetched successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        resumeText: resume.resumeText,
        uploadedAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({
      message: "Error fetching resume",
    });
  }
};

// ─────────────────────────────────────
// UPDATE RESUME
// PUT /api/resume/update
// ─────────────────────────────────────
const updateResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    let resumeText = "";
    let extractionFailed = false;
    try {
      resumeText = await extractTextFromPDF(req.file.path);
      if (!resumeText || resumeText.trim().length < 10) {
        extractionFailed = true;
      }
    } catch (error) {
      console.log("PDF extraction failed:", error.message || error);
      extractionFailed = true;
    }

    if (extractionFailed) {
      resumeText = `Resume: ${req.file.originalname}`;
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const resume = await Resume.findOneAndUpdate(
      { userId: req.user._id },
      { resumeText, fileName: req.file.originalname },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({
        message: "No resume found to update",
      });
    }

    res.status(200).json({
      message: extractionFailed
        ? "Resume updated, but text could not be extracted (file may be a scanned/image PDF)"
        : "Resume updated successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        resumeText: resumeText.substring(0, 200),
      },
    });
  } catch (error) {
    console.error("Update resume error:", error);
    res.status(500).json({
      message: "Error updating resume: " + error.message,
    });
  }
};
// ─────────────────────────────────────
// ANALYZE RESUME
// POST /api/resume/analyze
// ─────────────────────────────────────
const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        message: "Please provide a job description",
      });
    }

    // Get user resume
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Please upload your resume first",
      });
    }

    console.log("Analyzing resume with Groq...");

    // AI Prompt
    const prompt = `
You are an expert ATS resume analyzer.

Analyze this resume against the job description.

RESUME:
${resume.resumeText}

JOB DESCRIPTION:
${jobDescription}

Respond in this EXACT JSON format only, no extra text:
{
  "atsScore": <number 0-100>,
  "skillGaps": ["missing skill 1", "missing skill 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "strongPoints": ["strong point 1", "strong point 2"],
  "overallFeedback": "brief feedback here"
}
`;

    // Call Groq
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    console.log("Groq analysis complete!");

    // Parse response
    let analysisResult;
    try {
      const rawResponse = response.choices[0].message.content;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.status(500).json({
        message: "Error parsing AI response",
      });
    }

    // Save to MongoDB
    const ResumeAnalysis = require("../models/ResumeAnalysis");
    const newAnalysis = new ResumeAnalysis({
      userId: req.user._id,
      resumeText: resume.resumeText,
      jobDescription,
      atsScore: analysisResult.atsScore,
      skillGaps: analysisResult.skillGaps,
      suggestions: analysisResult.suggestions,
    });

    await newAnalysis.save();
    console.log("Analysis saved to MongoDB!");

    res.status(200).json({
      message: "Resume analyzed successfully",
      analysis: analysisResult,
    });

  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({
      message: "Error analyzing resume: " + error.message,
    });
  }
};
module.exports = { uploadResume, getResume, updateResume,analyzeResume};