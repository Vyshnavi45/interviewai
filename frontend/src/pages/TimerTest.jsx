// pages/TimerTest.jsx
// Test page for Timer component

import React, { useState } from "react";
import Timer from "../components/Timer";

const TimerTest = () => {
  const [readingActive, setReadingActive] = useState(false);
  const [answerActive, setAnswerActive] = useState(false);
  const [readingDone, setReadingDone] = useState(false);
  const [answerDone, setAnswerDone] = useState(false);
  const [key, setKey] = useState(0);

  // Reading time ends → start answer time
  const handleReadingTimeout = () => {
    console.log("Reading time ended!");
    setReadingActive(false);
    setReadingDone(true);
    setAnswerActive(true);
  };

  // Answer time ends
  const handleAnswerTimeout = () => {
    console.log("Answer time ended! Auto submit!");
    setAnswerActive(false);
    setAnswerDone(true);
  };

  // Reset everything
  const handleReset = () => {
    setReadingActive(false);
    setAnswerActive(false);
    setReadingDone(false);
    setAnswerDone(false);
    setKey((prev) => prev + 1);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>⏱️ Timer Test</h2>

      {/* Reading Timer */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          Reading Timer (10 seconds for testing)
        </h3>
        <Timer
          key={`reading-${key}`}
          timeLimit={10}
          isActive={readingActive}
          onTimeout={handleReadingTimeout}
          timerType="reading"
          onTick={(t) => console.log("Reading:", t)}
        />
        {readingDone && (
          <div style={styles.done}>
            ✅ Reading time done!
          </div>
        )}
      </div>

      {/* Answer Timer */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          Answer Timer (15 seconds for testing)
        </h3>
        <Timer
          key={`answer-${key}`}
          timeLimit={15}
          isActive={answerActive}
          onTimeout={handleAnswerTimeout}
          timerType="answer"
          onTick={(t) => console.log("Answer:", t)}
        />
        {answerDone && (
          <div style={styles.done}>
            ✅ Answer time done! Auto submitted!
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={styles.btnRow}>
        {!readingActive && !answerActive && !readingDone && (
          <button
            style={styles.startBtn}
            onClick={() => setReadingActive(true)}
          >
            ▶️ Start Reading Timer
          </button>
        )}

        {readingActive && (
          <button
            style={styles.skipBtn}
            onClick={() => {
              setReadingActive(false);
              setReadingDone(true);
              setAnswerActive(true);
            }}
          >
            ⏭️ Skip Reading (I'm Ready)
          </button>
        )}

        {answerDone && (
          <button
            style={styles.resetBtn}
            onClick={handleReset}
          >
            🔄 Reset Test
          </button>
        )}
      </div>

      {/* Info */}
      <div style={styles.infoBox}>
        <p>In real app:</p>
        <p>→ Reading time: 60 seconds</p>
        <p>→ Answer time: max 4 minutes</p>
        <p>Currently using short times for testing!</p>
      </div>

    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "2rem auto",
    padding: "2rem",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "1.5rem",
    color: "#1a1a2e",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1rem",
  },
  done: {
    marginTop: "0.75rem",
    color: "#166534",
    backgroundColor: "#f0fdf4",
    padding: "0.5rem",
    borderRadius: "6px",
    fontSize: "14px",
  },
  btnRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  startBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  skipBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  resetBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#6b7280",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1d4ed8",
    lineHeight: "1.8",
  },
};

export default TimerTest;