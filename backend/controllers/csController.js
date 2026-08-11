// controllers/csController.js
const TestSession = require("../models/TestSession");
const QuestionResult = require("../models/QuestionResult");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 30 * 1000, // 30 seconds instead of SDK default
  maxRetries: 2,       // auto-retry on timeouts/network errors
});

// ─────────────────────────────────────
// GENERATE CS QUESTIONS
// POST /api/cs/generate-questions
// ─────────────────────────────────────
const generateCSQuestions = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        message: "Please select a topic!",
      });
    }

    // Random number between 8 and 12
    const numQuestions =
      Math.floor(Math.random() * 5) + 8;

    console.log(
      `Generating ${numQuestions} ${topic} questions...`
    );

    // ✅ Simple but effective prompt
    const prompt = `
Generate exactly ${numQuestions} most frequently asked ${topic} interview questions that are commonly asked in campus placements, product companies and service companies.

Rules:
1. Questions should be important and frequently asked
2. Mix of conceptual and scenario based questions
3. Suitable for freshers and campus placements
4. Each question should be clear and specific
5. Include questions of varying difficulty

Return ONLY a JSON array like this (no extra text):
[
  "Question 1?",
  "Question 2?",
  "Question 3?"
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
      const rawResponse =
        response.choices[0].message.content;
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
      topic,
    });

  } catch (error) {
    console.error("Generate CS questions error:", error);
    res.status(500).json({
      message: "Error generating questions: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// GET AI TIME FOR QUESTION
// POST /api/cs/get-time
// Task 13.8: AI time allocation
// ─────────────────────────────────────
const getAITime = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    const prompt = `
Analyze this interview question and suggest appropriate time limit in seconds for a student to answer it in an interview setting.

Question: "${question}"

Rules:
- Simple definition questions: 60 seconds
- Explanation questions: 120 seconds
- Complex/multi-part questions: 180 seconds
- Design/scenario questions: 240 seconds
- Maximum time: 240 seconds

Return ONLY a JSON like this:
{
  "timeInSeconds": <number>,
  "difficulty": "<easy/medium/hard>"
}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    const rawResponse =
      response.choices[0].message.content;
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return res.status(200).json({
        timeInSeconds: Math.min(
          result.timeInSeconds,
          240
        ),
        difficulty: result.difficulty,
      });
    }

    // Default time if parsing fails
    res.status(200).json({
      timeInSeconds: 120,
      difficulty: "medium",
    });

  } catch (error) {
    console.error("Get AI time error:", error);
    res.status(200).json({
      timeInSeconds: 120,
      difficulty: "medium",
    });
  }
};

// ─────────────────────────────────────
// SUBMIT CS SESSION
// POST /api/cs/submit-session
// ─────────────────────────────────────
const submitCSSession = async (req, res) => {
  try {
    const {
      questions,
      answers,
      mode,
      topic,
      parentSessionId,
      attemptNumber,
    } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({
        message: "Questions and answers required",
      });
    }

    console.log(`Evaluating ${topic} answers...`);

    const evaluatedAnswers = [];
    let totalScore = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answerData = answers[i];

      console.log(`Evaluating Q${i + 1}...`);

      // Skipped questions
      if (answerData.status === "skipped") {
        evaluatedAnswers.push({
          questionText: question,
          questionNumber: i + 1,
          userAnswer: "",
          score: 0,
          whatYouGotRight: "",
          whatYouMissed: "",
          aiBetterAnswer: await getModelAnswer(
            question,
            topic
          ),
          // ✅ Add study links for skipped!
        studyLinks: await getTopicSpecificLinks(
        question,
        topic
       ),
          timeTaken: 0,
          timeLimit: answerData.timeLimit || 240,
          readingTimeTaken:
            answerData.readingTimeTaken || 0,
          status: "skipped",
        });
        continue;
      }

      // Timed out nothing
      if (answerData.status === "timedout-nothing") {
        evaluatedAnswers.push({
          questionText: question,
          questionNumber: i + 1,
          userAnswer: "",
          score: 0,
          whatYouGotRight: "",
          whatYouMissed: "",
          aiBetterAnswer: await getModelAnswer(
            question,
            topic
          ),
          // ✅ Study links for CS case 4!
          studyLinks: await getTopicSpecificLinks(
          question,
          topic
     ),
          timeTaken: answerData.timeTaken || 0,
          timeLimit: answerData.timeLimit || 240,
          readingTimeTaken:
            answerData.readingTimeTaken || 0,
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
      const evaluation = await evaluateCSAnswer(
        question,
        answerData.answer,
        answerData.status,
        topic
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
        readingTimeTaken:
          answerData.readingTimeTaken || 0,
        status: answerData.status,
      });
    }

    // Calculate score
    const attemptedCount = evaluatedAnswers.filter(
      (a) =>
        a.status === "submitted" ||
        a.status === "timedout-partial"
    ).length;

    const avgScore =
      attemptedCount > 0
        ? Math.round(totalScore / attemptedCount)
        : 0;

    // Handle retake
    const isRetake = parentSessionId ? true : false;
    let retakesUsed = 0;
    let canRetake = true;

    if (isRetake) {
      const parentSession = await TestSession.findById(
        parentSessionId
      );
      retakesUsed =
        (parentSession?.retakesUsed || 0) + 1;
      canRetake = retakesUsed < 2;

      await TestSession.findByIdAndUpdate(
        parentSessionId,
        { retakesUsed, canRetake }
      );
    }

    // Save session
    const newSession = new TestSession({
      userId: req.user._id,
      feature: "CS",
      topic,
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
    console.log("CS Session saved!");

    // Save question results
    const questionResults = evaluatedAnswers.map(
      (ans) => ({
        ...ans,
        sessionId: newSession._id,
        userId: req.user._id,
      })
    );

    await QuestionResult.insertMany(questionResults);
    console.log("CS Question results saved!");

    res.status(201).json({
      message: "CS Session submitted successfully",
      sessionId: newSession._id,
      totalScore: avgScore,
      totalQuestions: questions.length,
      topic,
    });

  } catch (error) {
    console.error("Submit CS session error:", error);
    res.status(500).json({
      message: "Error submitting session: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// GET CS SESSION
// GET /api/cs/session/:id
// ─────────────────────────────────────
const getCSSession = async (req, res) => {
  try {
    const session = await TestSession.findById(
      req.params.id
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    const questionResults = await QuestionResult.find({
      sessionId: session._id,
    }).sort({ questionNumber: 1 });

    res.status(200).json({
      message: "Session fetched successfully",
      session,
      questionResults,
    });

  } catch (error) {
    console.error("Get CS session error:", error);
    res.status(500).json({
      message: "Error fetching session: " + error.message,
    });
  }
};

// ─────────────────────────────────────
// Helper: Safely parse JSON returned by Groq
// ─────────────────────────────────────
const parseGroqJSON = (text) => {
  try {
    if (!text) {
      throw new Error("Empty AI response");
    }

    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found");
    }

    cleaned = cleaned.substring(start, end + 1);

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Groq JSON parsing failed:", error);
    console.error("Raw Groq response:", text);

    return null;
  }
};

// ─────────────────────────────────────
// Helper: Evaluate CS Answer
// ─────────────────────────────────────
const evaluateCSAnswer = async (
  question,
  answer,
  status,
  topic
) => {
  try {
    const prompt = `
You are an expert ${topic} interviewer evaluating a student's answer.

Question:
${question}

Topic:
${topic}

Student's Answer:
${answer || "No answer provided"}

Status:
${status}

Evaluate the student's answer fairly.

Return ONLY a valid JSON object with exactly these fields:

{
  "score": 0,
  "whatYouGotRight": "What the student explained correctly",
  "whatYouMissed": "What the student missed or explained incorrectly",
  "aiBetterAnswer": "A clear and correct model answer"
}

Rules:

- score must be a number from 0 to 100.
- whatYouGotRight must be a string.
- whatYouMissed must be a string.
- aiBetterAnswer must be a string.
- Do not use markdown code fences.
- Do not add any text outside the JSON object.
- Do not put actual line breaks inside JSON string values.
- Escape quotation marks properly.
- Keep the answer educational and suitable for a fresher interview.
- If the answer is partially correct, give partial credit.
- If the answer is incorrect, explain what is wrong.
- If the status is timedout-partial, evaluate only the answer that was actually given.
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content:
            "You are an interview evaluation system. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      max_tokens: 800,

      response_format: {
        type: "json_object",
      },
    });

    const rawResponse =
      response.choices?.[0]?.message?.content;

    console.log(
      "AI evaluation received for question:",
      question
    );

    const result = parseGroqJSON(rawResponse);

    if (!result) {
      return {
        score: 0,
        whatYouGotRight:
          "The answer was received, but AI evaluation could not be completed.",
        whatYouMissed:
          "AI evaluation failed for this question.",
        aiBetterAnswer:
          "Please review this topic and try again.",
      };
    }

    let score = Number(result.score);

    if (Number.isNaN(score)) {
      score = 0;
    }

    score = Math.max(
      0,
      Math.min(100, Math.round(score))
    );

    return {
      score,

      whatYouGotRight:
        typeof result.whatYouGotRight === "string"
          ? result.whatYouGotRight
          : "No specific strengths identified.",

      whatYouMissed:
        typeof result.whatYouMissed === "string"
          ? result.whatYouMissed
          : "No specific weaknesses identified.",

      aiBetterAnswer:
        typeof result.aiBetterAnswer === "string"
          ? result.aiBetterAnswer
          : "No model answer available.",
    };
  } catch (error) {
    console.error(
      "Evaluate CS answer error:",
      error
    );

    return {
      score: 0,
      whatYouGotRight:
        "Evaluation could not be completed.",
      whatYouMissed:
        "The AI evaluation service encountered an error.",
      aiBetterAnswer:
        "Please try this question again.",
    };
  }
};

// ─────────────────────────────────────
// Helper: Get Model Answer
// For skipped and timed out nothing
// ─────────────────────────────────────
const getModelAnswer = async (question, topic) => {
  try {
    const prompt = `
You are an expert ${topic} interviewer.
Give a perfect model answer for this question:

Question: ${question}
Topic: ${topic}

Give a clear, concise answer (4-6 sentences)
that would impress an interviewer.
Return ONLY the answer text.
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });

    return response.choices[0].message.content;

  } catch (error) {
    return "Model answer not available";
  }
};

// ─────────────────────────────────────
// Helper: Get Study Links Per Topic
// ✅ CS Case 4 only!
// ─────────────────────────────────────
// ─────────────────────────────────────
// Helper: Get Topic Specific Study Links
// AI generates specific links for question!
// ─────────────────────────────────────
const axios = require("axios");

const getTopicSpecificLinks = async (question, topic) => {
  try {
    // Step 1: Ask Groq for topic + keywords
    const prompt = `
You are a Computer Science Interview Expert.

Interview Subject:
${topic}

Interview Question:
"${question}"

Extract the learning topic and important search keywords.

Return ONLY valid JSON.

{
  "topic":"",
  "keywords":""
}
`;

    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
    });

    const raw = groqResponse.choices[0].message.content;

    let parsed = {
      topic,
      keywords: "",
    };

    try {
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsed = { topic, keywords: "", ...JSON.parse(cleaned) };
    } catch (err) {
      console.log("Groq parsing failed");
    }

    const websites = [
      {
        title: "📘 GeeksForGeeks",
        site: "geeksforgeeks.org",
      },
      {
        title: "📗 JavaTPoint",
        site: "javatpoint.com",
      },
      {
        title: "📙 TutorialsPoint",
        site: "tutorialspoint.com",
      },
    ];

    const searchText =
      `${topic} ${parsed.topic} ${parsed.keywords}`;

    const links = await Promise.all(
      websites.map(async (website) => {
        try {
          const response = await axios.post(
            "https://api.tavily.com/search",
            {
              api_key: process.env.TAVILY_API_KEY,
              query: `site:${website.site} ${searchText}`,
              search_depth: "advanced",
              max_results: 1,
            }
          );

          if (
            response.data.results &&
            response.data.results.length > 0
          ) {
            if (
              response.data.results[0].url.includes(
                website.site
              )
            ) {
              return {
                title: website.title,
                url: response.data.results[0].url,
              };
            }

            return null;
          }

          return null;
        } catch {
          return null;
        }
      })
    );

    const validLinks = links.filter(Boolean);

    if (validLinks.length) {
      return validLinks;
    }

    return getGeneralLinks(topic);

  } catch (err) {
    console.log(err);
    return getGeneralLinks(topic);
  }
};

// ─────────────────────────────────────
// Fallback general links per topic
// ─────────────────────────────────────
const getGeneralLinks = (topic) => {
  const links = {
    DBMS: [
      {
        title: "📘 GeeksForGeeks",
        url: "https://www.geeksforgeeks.org/dbms/",
      },
      {
        title: "📗 JavaTPoint",
        url: "https://www.javatpoint.com/dbms-tutorial",
      },
      {
        title: "📙 TutorialsPoint",
        url: "https://www.tutorialspoint.com/dbms/",
      },
    ],

    CN: [
      {
        title: "📘 GeeksForGeeks",
        url: "https://www.geeksforgeeks.org/computer-network-tutorials/",
      },
      {
        title: "📗 JavaTPoint",
        url: "https://www.javatpoint.com/computer-network-tutorial",
      },
      {
        title: "📙 TutorialsPoint",
        url: "https://www.tutorialspoint.com/data_communication_computer_network/",
      },
    ],

    OOPs: [
      {
        title: "📘 GeeksForGeeks",
        url: "https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/",
      },
      {
        title: "📗 JavaTPoint",
        url: "https://www.javatpoint.com/java-oops-concepts",
      },
      {
        title: "📙 TutorialsPoint",
        url: "https://www.tutorialspoint.com/cplusplus/cpp_object_oriented.htm",
      },
    ],

    OS: [
      {
        title: "📘 GeeksForGeeks",
        url: "https://www.geeksforgeeks.org/operating-systems/",
      },
      {
        title: "📗 JavaTPoint",
        url: "https://www.javatpoint.com/os-tutorial",
      },
      {
        title: "📙 TutorialsPoint",
        url: "https://www.tutorialspoint.com/operating_system/",
      },
    ],
  };

  return links[topic] || [];
};

module.exports = {
  generateCSQuestions,
  submitCSSession,
  getCSSession,
  getAITime,
};