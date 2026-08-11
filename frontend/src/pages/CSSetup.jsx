// pages/CSSetup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const TOPICS = [
  {
    id: "DBMS",
    name: "DBMS",
    icon: "🗄️",
    desc: "Database Management Systems",
  },
  {
    id: "CN",
    name: "Computer Networks",
    icon: "🌐",
    desc: "Networking concepts and protocols",
  },
  {
    id: "OOPs",
    name: "OOPs",
    icon: "💡",
    desc: "Object Oriented Programming",
  },
  {
    id: "OS",
    name: "Operating Systems",
    icon: "💻",
    desc: "OS concepts and algorithms",
  },
];

const CSSetup = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const [selectedTopic, setSelectedTopic] = useState("");
  const [mode, setMode] = useState("notimer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!selectedTopic) {
      setError("Please select a topic!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate questions
      const res = await axios.post(
        "http://localhost:5000/api/cs/generate-questions",
        { topic: selectedTopic },
        config
      );

      const questions = res.data.questions;

      // If timer mode get AI times for each question
      let aiTimes = [];
      if (mode === "timer") {
        console.log("Getting AI times...");
        const timePromises = questions.map((q) =>
          axios.post(
            "http://localhost:5000/api/cs/get-time",
            { question: q },
            config
          )
        );
        const timeResponses = await Promise.all(
          timePromises
        );
        aiTimes = timeResponses.map(
          (r) => r.data.timeInSeconds
        );
        console.log("AI times:", aiTimes);
      }

      // Navigate to test page
      navigate("/cs-test", {
        state: {
          questions,
          mode,
          feature: "CS",
          topic: selectedTopic,
          aiTimes,
        },
      });

    } catch (error) {
      console.error("Error:", error);
      setError("Error generating questions. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>InterviewAI</h1>
        <button
          style={styles.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.heading}>
          💻 CS Core Concepts Quiz
        </h2>

        {/* Topic Selection */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Select Topic
          </h3>
          <div style={styles.topicGrid}>
            {TOPICS.map((topic) => (
              <div
                key={topic.id}
                style={{
                  ...styles.topicCard,
                  ...(selectedTopic === topic.id
                    ? styles.topicCardActive
                    : {}),
                }}
                onClick={() =>
                  setSelectedTopic(topic.id)
                }
              >
                <div style={styles.topicIcon}>
                  {topic.icon}
                </div>
                <div style={styles.topicName}>
                  {topic.name}
                </div>
                <div style={styles.topicDesc}>
                  {topic.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Choose Timer Mode
          </h3>
          <div style={styles.modeGrid}>
            <div
              style={{
                ...styles.modeCard,
                ...(mode === "notimer"
                  ? styles.modeCardActive
                  : {}),
              }}
              onClick={() => setMode("notimer")}
            >
              <div style={styles.modeIcon}>🕐</div>
              <div style={styles.modeTitle}>
                No Timer
              </div>
              <div style={styles.modeDesc}>
                Answer at your pace.
                Max 4 minutes per question.
              </div>
            </div>

            <div
              style={{
                ...styles.modeCard,
                ...(mode === "timer"
                  ? styles.modeCardActive
                  : {}),
              }}
              onClick={() => setMode("timer")}
            >
              <div style={styles.modeIcon}>⏱️</div>
              <div style={styles.modeTitle}>
                With Timer
              </div>
              <div style={styles.modeDesc}>
                AI assigns time based on
                question difficulty.
                Max 4 minutes per question.
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={styles.infoCard}>
          <h3 style={styles.cardTitle}>
            What to expect
          </h3>
          <div style={styles.infoItem}>
            📖 60 seconds reading time per question
          </div>
          <div style={styles.infoItem}>
            🎤 Speak your answer (voice to text)
          </div>
          <div style={styles.infoItem}>
            ⏭️ Skip questions you are not sure about
          </div>
          <div style={styles.infoItem}>
            📚 Study links provided for unanswered questions
          </div>
          <div style={styles.infoItem}>
            🔄 2 retakes allowed per test
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Start Button */}
        <button
          style={loading ? styles.btnDisabled : styles.btn}
          onClick={handleStart}
          disabled={loading}
        >
          {loading
            ? "⏳ Generating questions..."
            : "🚀 Start Quiz"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  navbar: {
    backgroundColor: "#ffffff",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
  backBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  content: {
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1.5rem",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1rem",
  },
  topicGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  topicCard: {
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1.25rem",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
  },
  topicCardActive: {
    border: "2px solid #4f46e5",
    backgroundColor: "#eff6ff",
  },
  topicIcon: {
    fontSize: "32px",
    marginBottom: "0.5rem",
  },
  topicName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "0.25rem",
  },
  topicDesc: {
    fontSize: "12px",
    color: "#666",
  },
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  modeCard: {
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    padding: "1.25rem",
    cursor: "pointer",
    textAlign: "center",
  },
  modeCardActive: {
    border: "2px solid #4f46e5",
    backgroundColor: "#eff6ff",
  },
  modeIcon: {
    fontSize: "32px",
    marginBottom: "0.5rem",
  },
  modeTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "0.5rem",
  },
  modeDesc: {
    fontSize: "12px",
    color: "#666",
    lineHeight: "1.5",
  },
  infoCard: {
    backgroundColor: "#eff6ff",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    border: "1px solid #bfdbfe",
  },
  infoItem: {
    fontSize: "14px",
    color: "#1d4ed8",
    padding: "0.35rem 0",
  },
  error: {
    backgroundColor: "#ffe0e0",
    color: "#cc0000",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "14px",
  },
  btn: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnDisabled: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#9ca3af",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "not-allowed",
  },
};

export default CSSetup;