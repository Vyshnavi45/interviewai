// controllers/hrController.js
const TestSession = require("../models/TestSession");
const QuestionResult = require("../models/QuestionResult");
const Resume = require("../models/Resume");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────
// GENERATE HR QUESTIONS
// POST /api/hr/generate-questions
// ─────────────────────────────────────
const generateHRQuestions = async (req, res) => {
  try {
    // Get user resume
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Please upload your resume first!",
      });
    }

    console.log("Generating HR questions from resume...");

    // Random number between 8 and 12
    const numQuestions =
      Math.floor(Math.random() * 5) + 8;

    // AI Prompt for HR questions
    const prompt = `
You are an expert HR interviewer.

Based on this resume, generate exactly ${numQuestions} personalized HR interview questions.

RESUME:
${resume.resumeText}

Rules:
1. Questions must be based on the actual resume content
2. Ask about specific projects mentioned
3. Ask about skills listed
4. Mix of behavioral and technical HR questions
5. Questions should feel like a real HR interview

Return ONLY a JSON array like this (no extra text):
[
  "Question 1 here?",
  "Question 2 here?",
  "Question 3 here?"
]
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    console.log("Questions generated!");

    // Parse questions
    let questions = [];
    try {
      const rawResponse = response.choices[0].message.content;
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.status(500).json({
        message: "Error parsing AI questions",
      });
    }

    console.log(`Generated ${questions.length} questions!`);

    res.status(200).json({
      message: "Questions generated successfully",
      questions,
      totalQuestions: questions.length,
    });

  } catch (error) {
    console.error("Generate questions error:", error);
    res.status(500).json({
      message: "Error generating questions: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// SUBMIT HR SESSION
// POST /api/hr/submit-session
// ─────────────────────────────────────
const submitHRSession = async (req, res) => {
  try {
    const {
      questions,
      answers,
      mode,
      parentSessionId,
      attemptNumber,
    } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({
        message: "Questions and answers are required",
      });
    }

    console.log("Evaluating HR answers with AI...");

    // Get resume for context
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    // Evaluate each answer with AI
    const evaluatedAnswers = [];
    let totalScore = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answerData = answers[i];

      console.log(`Evaluating Q${i + 1}...`);

      // Skip evaluation for skipped questions
      if (answerData.status === "skipped") {
        evaluatedAnswers.push({
          questionText: question,
          questionNumber: i + 1,
          userAnswer: "",
          score: 0,
          whatYouGotRight: "",
          whatYouMissed: "",
          aiBetterAnswer: await getAIAnswer(question, "HR"),
          studyLinks: [],
          timeTaken: answerData.timeTaken || 0,
          timeLimit: answerData.timeLimit || 240,
          readingTimeTaken: answerData.readingTimeTaken || 0,
          status: "skipped",
        });
        continue;
      }

      // Timed out with no answer
      if (answerData.status === "timedout-nothing") {
        evaluatedAnswers.push({
          questionText: question,
          questionNumber: i + 1,
          userAnswer: "",
          score: 0,
          whatYouGotRight: "",
          whatYouMissed: "",
          aiBetterAnswer: await getAIAnswer(question, "HR"),
          studyLinks: [],
          timeTaken: answerData.timeTaken || 0,
          timeLimit: answerData.timeLimit || 240,
          readingTimeTaken: answerData.readingTimeTaken || 0,
          status: "timedout-nothing",
        });
        continue;
      }

      // Submitted but nothing was actually typed.
      // whatYouGotRight is forced to a fixed "Nothing" so it's
      // always consistent. whatYouMissed and aiBetterAnswer still
      // come from the AI, same as a normally answered question.
      const isBlankAnswer =
        !answerData.answer ||
        answerData.answer.trim() === "";

      // Evaluate answered questions
      const evaluation = await evaluateAnswer(
        question,
        answerData.answer,
        answerData.status,
        "HR",
        resume?.resumeText || ""
      );

      if (isBlankAnswer) {
        evaluation.whatYouGotRight = "Nothing";
      }

      totalScore += evaluation.score;

      evaluatedAnswers.push({
        questionText: question,
        questionNumber: i + 1,
        userAnswer: answerData.answer || "",
        score: evaluation.score,
        whatYouGotRight: evaluation.whatYouGotRight,
        whatYouMissed: evaluation.whatYouMissed,
        aiBetterAnswer: evaluation.aiBetterAnswer,
        studyLinks: [],
        timeTaken: answerData.timeTaken || 0,
        timeLimit: answerData.timeLimit || 240,
        readingTimeTaken: answerData.readingTimeTaken || 0,
        status: answerData.status,
      });
    }

    // Calculate average score
    const attemptedCount = evaluatedAnswers.filter(
      (a) =>
        a.status === "submitted" ||
        a.status === "timedout-partial"
    ).length;

    const avgScore =
      attemptedCount > 0
        ? Math.round(totalScore / attemptedCount)
        : 0;

    // Determine retake info
    const isRetake = parentSessionId ? true : false;
    let retakesUsed = 0;
    let canRetake = true;

    if (isRetake) {
      const parentSession = await TestSession.findById(
        parentSessionId
      );
      retakesUsed = (parentSession?.retakesUsed || 0) + 1;
      canRetake = retakesUsed < 2;

      // Update parent session retake count
      await TestSession.findByIdAndUpdate(parentSessionId, {
        retakesUsed,
        canRetake,
      });
    }

    // Save test session
    const newSession = new TestSession({
      userId: req.user._id,
      feature: "HR",
      topic: "NA",
      mode,
      questions,
      totalQuestions: questions.length,
      totalScore: avgScore,
      attemptNumber: attemptNumber || 1,
      retakesUsed: isRetake ? retakesUsed : 0,
      maxRetakes: 2,
      canRetake: isRetake ? canRetake : true,
      parentSessionId: parentSessionId || null,
    });

    await newSession.save();
    console.log("Session saved!");

    // Save all question results
    const questionResults = evaluatedAnswers.map((ans) => ({
      ...ans,
      sessionId: newSession._id,
      userId: req.user._id,
    }));

    await QuestionResult.insertMany(questionResults);
    console.log("Question results saved!");

    res.status(201).json({
      message: "Session submitted successfully",
      sessionId: newSession._id,
      totalScore: avgScore,
      totalQuestions: questions.length,
    });

  } catch (error) {
    console.error("Submit session error:", error);
    res.status(500).json({
      message: "Error submitting session: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// GET HR SESSION
// GET /api/hr/session/:id
// ─────────────────────────────────────
const getHRSession = async (req, res) => {
  try {
    const session = await TestSession.findById(
      req.params.id
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // Get all question results
    const questionResults = await QuestionResult.find({
      sessionId: session._id,
    }).sort({ questionNumber: 1 });

    res.status(200).json({
      message: "Session fetched successfully",
      session,
      questionResults,
    });

  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({
      message: "Error fetching session: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// Helper: Evaluate Answer With AI
// ─────────────────────────────────────
const evaluateAnswer = async (
  question,
  answer,
  status,
  type,
  resumeText
) => {
  try {
    const prompt = `
You are an expert HR interviewer evaluating an interview answer.

Question: ${question}
Candidate's Answer: ${answer && answer.trim() ? answer : "No answer provided"}
Answer Status: ${status}
${resumeText ? `Resume Context: ${resumeText.substring(0, 500)}` : ""}

Evaluate the CANDIDATE'S ANSWER above, not the resume context.
If the candidate's answer is "No answer provided", the score must be 0,
whatYouGotRight must be an empty string, and whatYouMissed must explain
that no answer was given. Do NOT evaluate or reference the resume context
as if it were the candidate's spoken answer.

Respond in this EXACT JSON format only:
{
  "score": <number 0-100>,
  "whatYouGotRight": "<what was good about the answer>",
  "whatYouMissed": "<what was missing or could be better>",
  "aiBetterAnswer": "<a better version of the answer>"
}

If the answer is partial (timedout-partial), evaluate what was given.
Be fair and constructive in your evaluation.
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const rawResponse = response.choices[0].message.content;
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      score: 0,
      whatYouGotRight: "",
      whatYouMissed: "Could not evaluate answer",
      aiBetterAnswer: "",
    };

  } catch (error) {
    console.error("Evaluate answer error:", error);
    return {
      score: 0,
      whatYouGotRight: "",
      whatYouMissed: "Evaluation failed",
      aiBetterAnswer: "",
    };
  }
};

// ─────────────────────────────────────
// Helper: Get AI Model Answer
// For skipped and timed out nothing
// ─────────────────────────────────────
const getAIAnswer = async (question, type) => {
  try {
    const prompt = `
You are an expert ${type} interviewer.
Provide a perfect model answer for this question:

Question: ${question}

Respond with ONLY the model answer text, nothing else.
Keep it concise and professional (3-5 sentences).
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (error) {
    return "Model answer not available";
  }
};

module.exports = {
  generateHRQuestions,
  submitHRSession,
  getHRSession,
};