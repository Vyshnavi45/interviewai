// pages/RetakeSetup.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RetakeSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    parentSessionId,
    questions,
    topic,
    feature,
    retakesUsed,
  } = location.state || {};

  const [mode, setMode] = useState("notimer");

  const retakesLeft = 2 - (retakesUsed || 0);
  const attemptNumber = (retakesUsed || 0) + 2;

  const handleStart = () => {
    // Navigate to test page with SAME questions!
    navigate(
      feature === "HR" ? "/hr-test" : "/cs-test",
      {
        state: {
          questions,
          mode,
          feature,
          topic,
          parentSessionId,
          attemptNumber,
          isRetake: true,
        },
      }
    );
  };

  return (
    <div style={styles.container}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>InterviewAI</h1>
        <button
          style={styles.backBtn}
          onClick={() => navigate("/history")}
        >
          ← Back to History
        </button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.heading}>
          🔄 Retake Test
        </h2>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>
              Feature:
            </span>
            <span style={styles.infoValue}>
              {feature === "HR"
                ? "👔 HR Interview"
                : "💻 CS Quiz"}
            </span>
          </div>
          {feature === "CS" && topic && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>
                Topic:
              </span>
              <span style={styles.infoValue}>
                {topic}
              </span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>
              Questions:
            </span>
            <span style={styles.infoValue}>
              {questions?.length} (same as original)
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>
              Attempt:
            </span>
            <span style={styles.infoValue}>
              #{attemptNumber}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>
              Retakes left after this:
            </span>
            <span style={{
              ...styles.infoValue,
              color: retakesLeft <= 1
                ? "#ef4444"
                : "#22c55e",
            }}>
              {retakesLeft - 1}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div style={styles.warningCard}>
          ⚠️ You will get the same {questions?.length} questions
          from your original test. Choose your mode wisely!
        </div>

        {/* Mode Selection */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Choose Timer Mode
          </h3>
          <p style={styles.cardDesc}>
            You can choose any mode regardless of
            what you used before!
          </p>
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
                Answer at your own pace.
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

        {/* Start Button */}
        <button
          style={styles.btn}
          onClick={handleStart}
        >
          🚀 Start Retake
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
  infoCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1rem",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
  },
  infoLabel: {
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    color: "#1a1a2e",
    fontWeight: "600",
  },
  warningCard: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    fontSize: "14px",
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
    marginBottom: "0.5rem",
  },
  cardDesc: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "1rem",
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
};

export default RetakeSetup;
