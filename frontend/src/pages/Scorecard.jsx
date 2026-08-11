// pages/Scorecard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Scorecard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const {
    sessionId,
    totalScore,
    totalQuestions,
    feature,
    questions,
  } = location.state || {};

  const [session, setSession] = useState(null);
  const [questionResults, setQuestionResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const endpoint =
        feature === "HR"
          ? `https://interviewai-backend-x3r5.onrender.com/api/hr/session/${sessionId}`
          : `https://interviewai-backend-x3r5.onrender.com/api/cs/session/${sessionId}`;

      const res = await axios.get(endpoint, config);
      setSession(res.data.session);
      setQuestionResults(res.data.questionResults);
    } catch (error) {
      console.error("Fetch session error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: {
        bg: "#f0fdf4",
        color: "#166534",
        text: "✅ Submitted",
      },
      skipped: {
        bg: "#fffbeb",
        color: "#92400e",
        text: "⏭️ Skipped",
      },
      "timedout-partial": {
        bg: "#fef2f2",
        color: "#991b1b",
        text: "⌛ Timed Out (Partial)",
      },
      "timedout-nothing": {
        bg: "#fef2f2",
        color: "#991b1b",
        text: "❌ Timed Out (No Answer)",
      },
    };
    return badges[status] || badges.submitted;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading scorecard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>InterviewAI</h1>
        <button
          style={styles.dashBtn}
          onClick={() => navigate("/dashboard")}
        >
          🏠 Dashboard
        </button>
      </div>

      <div style={styles.content}>

        {/* Overall Score */}
        <div style={styles.scoreCard}>
          <div style={styles.scoreEmoji}>🎉</div>
          <h2 style={styles.scoreTitle}>
            Test Completed!
          </h2>
          <div
            style={{
              ...styles.scoreNumber,
              color: getScoreColor(totalScore),
            }}
          >
            {totalScore}
            <span style={styles.scoreMax}>/100</span>
          </div>
          <div style={styles.scorebar}>
            <div
              style={{
                ...styles.scorebarFill,
                width: `${totalScore}%`,
                backgroundColor: getScoreColor(totalScore),
              }}
            />
          </div>
          <p style={styles.scoreSubtitle}>
            {feature === "HR"
              ? "HR Interview"
              : "CS Quiz"}{" "}
            • {totalQuestions} Questions
          </p>
        </div>

        {/* Summary */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryNumber}>
              {
                questionResults.filter(
                  (q) => q.status === "submitted"
                ).length
              }
            </div>
            <div style={styles.summaryLabel}>
              Submitted ✅
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryNumber}>
              {
                questionResults.filter(
                  (q) => q.status === "skipped"
                ).length
              }
            </div>
            <div style={styles.summaryLabel}>
              Skipped ⏭️
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryNumber}>
              {
                questionResults.filter((q) =>
                  q.status.includes("timedout")
                ).length
              }
            </div>
            <div style={styles.summaryLabel}>
              Timed Out ⌛
            </div>
          </div>
        </div>

        {/* Question List */}
        <div style={styles.questionList}>
          <h3 style={styles.sectionTitle}>
            Question Results
          </h3>
          {questionResults.map((result, i) => {
            const badge = getStatusBadge(result.status);
            return (
              <div key={i} style={styles.questionItem}>
                <div style={styles.questionHeader}>
                  <span style={styles.questionNum}>
                    Q{result.questionNumber}
                  </span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.text}
                  </span>
                  <span
                    style={{
                      ...styles.scoreBadge,
                      color: getScoreColor(result.score),
                    }}
                  >
                    {result.score}/100
                  </span>
                </div>
                <div style={styles.questionText}>
                  {result.questionText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={styles.actionRow}>
          <button
            style={styles.reportBtn}
            onClick={() =>
              navigate("/report", {
                state: {
                  sessionId,
                  feature,
                },
              })
            }
          >
            📊 View Detailed Report
          </button>

          {session?.canRetake && (
            <button
              style={styles.retakeBtn}
              onClick={() =>
                navigate("/retake", {
                  state: {
                    parentSessionId: sessionId,
                    questions,
                    topic: location.state?.topic,
                    feature,
                    retakesUsed: session?.retakesUsed || 0,
                  },
                })
              }
            >
              🔄 Retake Test
            </button>
          )}
        </div>

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
  dashBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  content: {
    padding: "2rem",
    maxWidth: "700px",
    margin: "0 auto",
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  scoreEmoji: {
    fontSize: "48px",
    marginBottom: "0.5rem",
  },
  scoreTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1rem",
  },
  scoreNumber: {
    fontSize: "72px",
    fontWeight: "bold",
    lineHeight: "1",
    marginBottom: "1rem",
  },
  scoreMax: {
    fontSize: "32px",
    color: "#9ca3af",
  },
  scorebar: {
    height: "12px",
    backgroundColor: "#e5e7eb",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "1rem",
  },
  scorebarFill: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.5s ease",
  },
  scoreSubtitle: {
    fontSize: "14px",
    color: "#666",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "1rem",
  },
  summaryItem: {
    textAlign: "center",
  },
  summaryNumber: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#666",
    marginTop: "0.25rem",
  },
  questionList: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1rem",
  },
  questionItem: {
    padding: "0.75rem 0",
    borderBottom: "1px solid #f3f4f6",
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.35rem",
  },
  questionNum: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#4f46e5",
  },
  statusBadge: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "20px",
    fontWeight: "500",
  },
  scoreBadge: {
    fontSize: "13px",
    fontWeight: "600",
    marginLeft: "auto",
  },
  questionText: {
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.4",
  },
  actionRow: {
    display: "flex",
    gap: "1rem",
  },
  reportBtn: {
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
  retakeBtn: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Scorecard;