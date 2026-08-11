// pages/TestPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import VoiceRecorder from "../components/VoiceRecorder";
import Timer from "../components/Timer";

const READING_TIME = 60; // 60 seconds reading time
const MAX_ANSWER_TIME = 240; // 4 minutes max

const TestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Get data from navigation state
  const { questions, mode, feature } = location.state || {};

  // Question state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("reading");
  // reading = reading time, answering = answer time

  // Timer state
  const [readingActive, setReadingActive] = useState(true);
  const [answerActive, setAnswerActive] = useState(false);
  const [answerTimeLimit, setAnswerTimeLimit] = useState(
    MAX_ANSWER_TIME
  );

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");

  // Timing tracking
  const [readingStartTime, setReadingStartTime] = useState(
    Date.now()
  );
  const [answerStartTime, setAnswerStartTime] = useState(null);
  const [readingTimeTaken, setReadingTimeTaken] = useState(0);

  // Answers collection
  const [answers, setAnswers] = useState([]);

  // Loading state
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Ref for current answer
  const currentAnswerRef = useRef("");

  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;

  // Get AI time for timer mode
  const getAITime = (question) => {
    // Simple difficulty based on question length and keywords
    const complexKeywords = [
      "explain",
      "describe",
      "discuss",
      "design",
      "compare",
      "all",
    ];
    const isComplex = complexKeywords.some((k) =>
      question.toLowerCase().includes(k)
    );
    const wordCount = question.split(" ").length;

    if (wordCount > 20 || isComplex) return 180; // 3 minutes
    if (wordCount > 10) return 120; // 2 minutes
    return 60; // 1 minute
  };

  // When question changes reset everything
  useEffect(() => {
    if (!questions || currentIndex >= questions.length) return;

    setPhase("reading");
    setReadingActive(true);
    setAnswerActive(false);
    setIsRecording(false);
    setCurrentAnswer("");
    currentAnswerRef.current = "";
    setReadingStartTime(Date.now());

    // Set answer time based on mode
    if (mode === "timer") {
      // ✅ Use AI times from CS setup if available
      const { aiTimes } = location.state || {};
      if (aiTimes && aiTimes[currentIndex]) {
        setAnswerTimeLimit(aiTimes[currentIndex]);
      } else {
        setAnswerTimeLimit(
          getAITime(questions[currentIndex])
        );
      }
    } else {
      setAnswerTimeLimit(MAX_ANSWER_TIME);
    }
  }, [currentIndex]);

  // Reading time ended → start answer time
  const handleReadingTimeout = () => {
    const timeTaken = Math.round(
      (Date.now() - readingStartTime) / 1000
    );
    setReadingTimeTaken(timeTaken);
    setReadingActive(false);
    setPhase("answering");
    setAnswerActive(true);
    setIsRecording(true);
    setAnswerStartTime(Date.now());
  };

  // User clicks I'm Ready
  const handleImReady = () => {
    const timeTaken = Math.round(
      (Date.now() - readingStartTime) / 1000
    );
    setReadingTimeTaken(timeTaken);
    setReadingActive(false);
    setPhase("answering");
    setAnswerActive(true);
    setIsRecording(true);
    setAnswerStartTime(Date.now());
  };

  // User clicks Skip during reading
  const handleSkip = () => {
    const timeTaken = Math.round(
      (Date.now() - readingStartTime) / 1000
    );

    saveAnswer({
      answer: "",
      status: "skipped",
      timeTaken: 0,
      timeLimit: answerTimeLimit,
      readingTimeTaken: timeTaken,
    });
  };

  // User clicks Submit
  const handleSubmit = () => {
    const timeTaken = answerStartTime
      ? Math.round((Date.now() - answerStartTime) / 1000)
      : 0;

    setIsRecording(false);
    setAnswerActive(false);

    // Small delay to get final text
    setTimeout(() => {
      const answer = currentAnswerRef.current || "";
      saveAnswer({
        answer,
        status: "submitted",
        timeTaken,
        timeLimit: answerTimeLimit,
        readingTimeTaken,
      });
    }, 500);
  };

  // Answer timer ended
  const handleAnswerTimeout = () => {
    const timeTaken = answerTimeLimit;
    setIsRecording(false);
    setAnswerActive(false);

    setTimeout(() => {
      const answer = currentAnswerRef.current || "";
      const status =
        answer.trim().length > 0
          ? "timedout-partial"
          : "timedout-nothing";

      saveAnswer({
        answer,
        status,
        timeTaken,
        timeLimit: answerTimeLimit,
        readingTimeTaken,
      });
    }, 500);
  };

  // Save answer and move to next
  const saveAnswer = (answerData) => {
    const newAnswers = [...answers, answerData];
    setAnswers(newAnswers);

    // Check if last question
    if (currentIndex + 1 >= totalQuestions) {
      // Submit all answers
      submitSession(newAnswers);
    } else {
      // Move to next question
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Submit entire session
  const submitSession = async (finalAnswers) => {
    setSubmitting(true);
    setLoadingMessage("Evaluating your answers...");

    try {
      const endpoint = `http://localhost:5000/api/${
        feature === "HR" ? "hr" : "cs"
      }/submit-session`;

      const response = await axios.post(
        endpoint,
        {
          questions,
          answers: finalAnswers,
          mode,
          topic: location.state?.topic,
          attemptNumber: location.state?.attemptNumber || 1,
          parentSessionId: location.state?.parentSessionId || null,
        },
        config
      );

      setLoadingMessage("Generating your report...");

      // Navigate to scorecard
      setTimeout(() => {
        navigate("/scorecard", {
          state: {
            sessionId: response.data.sessionId,
            totalScore: response.data.totalScore,
            totalQuestions: response.data.totalQuestions,
            feature,
            questions,
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Submit error:", error);
      setLoadingMessage("Error submitting. Please try again.");
      setSubmitting(false);
    }
  };

  // Update current answer ref from voice recorder
  const handleVoiceUpdate = (text) => {
    currentAnswerRef.current = text;
    setCurrentAnswer(text);
  };

  // Loading screen
  if (submitting) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>⏳</div>
          <h2 style={styles.loadingTitle}>
            {loadingMessage}
          </h2>
          <p style={styles.loadingSubtitle}>
            Please wait while AI evaluates your answers...
          </p>
          <div style={styles.loadingBar}>
            <div style={styles.loadingBarFill} />
          </div>
        </div>
      </div>
    );
  }

  // No questions guard
  if (!questions || questions.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <p>No questions found! Please go back.</p>
          <button
            onClick={() => navigate("/hr-interview")}
            style={styles.btn}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>
            {feature === "HR"
              ? "🎤 HR Interview"
              : "💻 CS Quiz"}
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.questionCount}>
            Q{currentIndex + 1} of {totalQuestions}
          </span>
          <span
            style={{
              ...styles.modeBadge,
              backgroundColor:
                mode === "timer" ? "#eff6ff" : "#f0fdf4",
              color:
                mode === "timer" ? "#1d4ed8" : "#166534",
            }}
          >
            {mode === "timer" ? "⏱️ Timer" : "🕐 No Timer"}
          </span>
        </div>
      </div>

      <div style={styles.content}>

        {/* Progress Bar */}
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${
                ((currentIndex) / totalQuestions) * 100
              }%`,
            }}
          />
        </div>

        {/* Question */}
        <div style={styles.questionCard}>
          <div style={styles.questionNumber}>
            Question {currentIndex + 1}
          </div>
          <div style={styles.questionText}>
            {currentQuestion}
          </div>
        </div>

        {/* READING PHASE */}
        {phase === "reading" && (
          <div style={styles.phaseCard}>
            <div style={styles.phaseTitle}>
              📖 Reading Time
            </div>
            <p style={styles.phaseDesc}>
              Read the question carefully and prepare
              your answer. Recording starts after
              reading time.
            </p>

            {/* Reading Timer */}
            <Timer
              key={`reading-${currentIndex}`}
              timeLimit={READING_TIME}
              isActive={readingActive}
              onTimeout={handleReadingTimeout}
              timerType="reading"
            />

            {/* Buttons */}
            <div style={styles.btnRow}>
              <button
                style={styles.readyBtn}
                onClick={handleImReady}
              >
                ✅ I'm Ready
              </button>
              <button
                style={styles.skipBtn}
                onClick={handleSkip}
              >
                ⏭️ Skip Question
              </button>
            </div>
          </div>
        )}

        {/* ANSWERING PHASE */}
        {phase === "answering" && (
          <div style={styles.phaseCard}>
            <div style={styles.phaseTitle}>
              🎤 Answer Time
            </div>

            {/* Answer Timer */}
            <Timer
              key={`answer-${currentIndex}`}
              timeLimit={answerTimeLimit}
              isActive={answerActive}
              onTimeout={handleAnswerTimeout}
              timerType="answer"
            />

            {/* Voice Recorder */}
            <VoiceRecorder
              isRecording={isRecording}
              onTextUpdate={handleVoiceUpdate}
              onFinalText={(text) => {
                currentAnswerRef.current = text;
              }}
              onStop={(text) => {
                currentAnswerRef.current = text;
              }}
            />

            {/* Submit Button */}
            <div style={styles.submitRow}>
              <button
                style={styles.submitBtn}
                onClick={handleSubmit}
              >
                ✅ Submit Answer
              </button>
            </div>

            {/* Auto submit note */}
            <p style={styles.autoNote}>
              Answer auto-submits when time runs out
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a2e",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  questionCount: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },
  modeBadge: {
    padding: "0.35rem 0.75rem",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },
  content: {
    padding: "1.5rem",
    maxWidth: "700px",
    margin: "0 auto",
  },
  progressBar: {
    height: "6px",
    backgroundColor: "#e5e7eb",
    borderRadius: "3px",
    marginBottom: "1.5rem",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  questionCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
  },
  questionNumber: {
    fontSize: "12px",
    color: "#4f46e5",
    fontWeight: "600",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },
  questionText: {
    fontSize: "18px",
    fontWeight: "500",
    color: "#1a1a2e",
    lineHeight: "1.6",
  },
  phaseCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  phaseTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "0.5rem",
  },
  phaseDesc: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "1rem",
    lineHeight: "1.5",
  },
  btnRow: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  readyBtn: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  skipBtn: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#ffffff",
    color: "#666",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
  },
  submitRow: {
    marginTop: "1rem",
  },
  submitBtn: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  autoNote: {
    textAlign: "center",
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "0.5rem",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    padding: "3rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
    maxWidth: "400px",
  },
  loadingIcon: {
    fontSize: "48px",
    marginBottom: "1rem",
  },
  loadingTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "0.5rem",
  },
  loadingSubtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "1.5rem",
  },
  loadingBar: {
    height: "4px",
    backgroundColor: "#e5e7eb",
    borderRadius: "2px",
    overflow: "hidden",
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: "2px",
    animation: "loading 2s infinite",
    width: "60%",
  },
  btn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "1rem",
  },
};

export default TestPage;