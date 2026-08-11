// pages/VoiceTest.jsx
// Test page for voice recording

import React, { useState } from "react";
import VoiceRecorder from "../components/VoiceRecorder";

const VoiceTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [liveText, setLiveText] = useState("");

  // ✅ Updated with auto stop after 5 seconds
  const handleStart = () => {
    setFinalAnswer("");
    setLiveText("");
    setIsRecording(true);

    // Auto stop after 5 seconds
    // Simulates timer running out!
    // In real app this will be 240 seconds
    setTimeout(() => {
      console.log("Timer ended! Auto stopping...");
      setIsRecording(false);
    }, 30000); // 5 seconds for testing
  };

  const handleStop = () => {
    setIsRecording(false);
  };

  const handleFinalText = (text) => {
    setFinalAnswer(text);
    console.log("Final answer:", text);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        🎤 Voice Recording Test
      </h2>

      {/* Timer Info */}
      <div style={styles.infoBox}>
        ⏱️ Auto stops after 5 seconds
        (In real app: 4 minutes)
      </div>

      {/* Voice Recorder Component */}
      <VoiceRecorder
        isRecording={isRecording}
        onTextUpdate={(text) => setLiveText(text)}
        onFinalText={handleFinalText}
        onStop={() => setIsRecording(false)}
      />

      {/* Control Buttons */}
      <div style={styles.btnRow}>
        {!isRecording ? (
          <button
            style={styles.startBtn}
            onClick={handleStart}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button
            style={styles.stopBtn}
            onClick={handleStop}
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      {/* Status */}
      {isRecording && (
        <div style={styles.status}>
          🔴 Recording... speak now!
          Auto stops in 5 seconds!
        </div>
      )}

      {/* Final Answer */}
      {finalAnswer && (
        <div style={styles.finalAnswer}>
          <h3 style={styles.finalTitle}>
            ✅ Final Answer:
          </h3>
          <p style={styles.finalText}>
            {finalAnswer}
          </p>
        </div>
      )}

      {/* Test Again Button */}
      {finalAnswer && (
        <button
          style={styles.resetBtn}
          onClick={() => {
            setFinalAnswer("");
            setLiveText("");
            setIsRecording(false);
          }}
        >
          🔄 Test Again
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  heading: {
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "#1a1a2e",
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "1rem",
    border: "1px solid #bfdbfe",
  },
  btnRow: {
    marginTop: "1rem",
    display: "flex",
    gap: "1rem",
  },
  startBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  stopBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  status: {
    marginTop: "1rem",
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: "500",
  },
  finalAnswer: {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    border: "1px solid #86efac",
  },
  finalTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#166534",
    marginBottom: "0.5rem",
  },
  finalText: {
    fontSize: "14px",
    color: "#333",
    lineHeight: "1.6",
  },
  resetBtn: {
    marginTop: "1rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default VoiceTest;