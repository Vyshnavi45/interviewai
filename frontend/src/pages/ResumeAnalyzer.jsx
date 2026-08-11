import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ResumeAnalyzer = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/resume/get",
        config
      );
      setResume(res.data.resume);
    } catch {
      setResume(null);
    }
  };

  const handleAnalyze = async () => {
    if (!resume) {
      setError("Please upload your resume first!");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please enter a job description!");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/resume/analyze",
        { jobDescription },
        config
      );
      setAnalysis(res.data.analysis);
    } catch {
      setError("Error analyzing resume. Try again!");
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
        <h2 style={styles.heading}>📄 Resume Analyzer</h2>

        {/* Resume Status */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Your Resume</h3>
          {resume ? (
            <div style={styles.resumeFound}>
              <span>✅ {resume.fileName}</span>
              <button
                style={styles.changeBtn}
                onClick={() => navigate("/dashboard")}
              >
                Change
              </button>
            </div>
          ) : (
            <div style={styles.resumeNotFound}>
              <span>❌ No resume found!</span>
              <button
                style={styles.uploadBtn}
                onClick={() => navigate("/dashboard")}
              >
                Upload Resume
              </button>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Paste Job Description
          </h3>
          <textarea
            style={styles.textarea}
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Analyze Button */}
        <button
          style={loading ? styles.btnDisabled : styles.btn}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading
            ? "⏳ Analyzing... Please wait..."
            : "🔍 Analyze Resume"}
        </button>

        {/* Results */}
        {analysis && (
          <div>

            {/* ATS Score */}
            <div style={styles.scoreCard}>
              <h3 style={styles.cardTitle}>ATS Score</h3>
              <div style={styles.scoreCircle}>
                <span
                  style={{
                    ...styles.scoreNumber,
                    color:
                      analysis.atsScore >= 70
                        ? "#22c55e"
                        : analysis.atsScore >= 40
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {analysis.atsScore}
                </span>
                <span style={styles.scoreTotal}>/100</span>
              </div>
              <div style={styles.scoreBar}>
                <div
                  style={{
                    ...styles.scoreBarFill,
                    width: `${analysis.atsScore}%`,
                    backgroundColor:
                      analysis.atsScore >= 70
                        ? "#22c55e"
                        : analysis.atsScore >= 40
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                />
              </div>
              <p style={styles.feedback}>
                {analysis.overallFeedback}
              </p>
            </div>

            {/* Strong Points */}
            {analysis.strongPoints?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  ✅ Strong Points
                </h3>
                {analysis.strongPoints.map((point, i) => (
                  <div key={i} style={styles.listItem}>
                    <span style={{ color: "#22c55e" }}>●</span>
                    {point}
                  </div>
                ))}
              </div>
            )}

            {/* Skill Gaps */}
            {analysis.skillGaps?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  ❌ Skill Gaps
                </h3>
                {analysis.skillGaps.map((gap, i) => (
                  <div key={i} style={styles.listItem}>
                    <span style={{ color: "#ef4444" }}>●</span>
                    {gap}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  💡 Suggestions
                </h3>
                {analysis.suggestions.map((s, i) => (
                  <div key={i} style={styles.listItem}>
                    <span style={{ color: "#4f46e5" }}>●</span>
                    {s}
                  </div>
                ))}
              </div>
            )}

            {/* Analyze Again */}
            <button
              style={styles.btn}
              onClick={() => {
                setAnalysis(null);
                setJobDescription("");
              }}
            >
              🔄 Analyze Again
            </button>

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
    maxWidth: "800px",
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
  resumeFound: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: "0.75rem",
    borderRadius: "8px",
    color: "#166534",
  },
  resumeNotFound: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: "0.75rem",
    borderRadius: "8px",
    color: "#991b1b",
  },
  changeBtn: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  uploadBtn: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
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
    marginBottom: "1.5rem",
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
    marginBottom: "1.5rem",
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  scoreCircle: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: "4px",
    marginBottom: "1rem",
  },
  scoreNumber: {
    fontSize: "64px",
    fontWeight: "bold",
  },
  scoreTotal: {
    fontSize: "24px",
    color: "#666",
  },
  scoreBar: {
    height: "12px",
    backgroundColor: "#e5e7eb",
    borderRadius: "6px",
    marginBottom: "1rem",
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: "6px",
  },
  feedback: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.5",
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    padding: "0.5rem 0",
    fontSize: "14px",
    color: "#333",
    borderBottom: "1px solid #f3f4f6",
  },
};

export default ResumeAnalyzer;