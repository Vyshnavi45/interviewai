// pages/Report.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Report = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const { sessionId, feature, fromHistory = false } = location.state || {};

  const [session, setSession] = useState(null);
  const [questionResults, setQuestionResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) fetchReport();
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      const endpoint =
        feature === "HR"
          ? `http://localhost:5000/api/hr/session/${sessionId}`
          : `http://localhost:5000/api/cs/session/${sessionId}`;

      const res = await axios.get(endpoint, config);
      setSession(res.data.session);
      setQuestionResults(res.data.questionResults);
    } catch (error) {
      console.error("Fetch report error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ─────────────────────────────────────
  // Render each question based on case
  // ─────────────────────────────────────
  const renderQuestion = (result, index) => {
    const isCase1 = result.status === "submitted";
    const isCase2 = result.status === "skipped";
    const isCase3 = result.status === "timedout-partial";
    const isCase4 = result.status === "timedout-nothing";
    const isCS = feature === "CS";

    return (
      <div key={index} style={styles.questionCard}>

        {/* Question Header */}
        <div style={styles.qHeader}>
          <div style={styles.qLeft}>
            <span style={styles.qNumber}>
              Q{result.questionNumber}
            </span>
            <span style={{
              ...styles.statusBadge,
              ...getStatusStyle(result.status),
            }}>
              {getStatusText(result.status)}
            </span>
          </div>
          <span style={{
            ...styles.qScore,
            color: getScoreColor(result.score),
          }}>
            {result.score}/100
          </span>
        </div>

        {/* Question Text */}
        <div style={styles.qText}>
          {result.questionText}
        </div>

        {/* Time Info */}
        <div style={styles.timeInfo}>
          {result.status !== "skipped" && (
            <span>
              ⏱️ Time taken: {formatTime(result.timeTaken)}
              / {formatTime(result.timeLimit)}
            </span>
          )}
        </div>

        <div style={styles.divider} />

        {/* ✅ CASE 1: Submitted */}
        {isCase1 && (
          <div>
            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🎤 Your Answer:
              </div>
              <div style={styles.answerBox}>
                {result.userAnswer || "No answer recorded"}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                ✅ What You Got Right:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#f0fdf4",
                borderLeft: "4px solid #22c55e",
              }}>
                {result.whatYouGotRight ||
                  "Keep practicing!"}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                ❌ What You Missed:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#fef2f2",
                borderLeft: "4px solid #ef4444",
              }}>
                {result.whatYouMissed ||
                  "Good answer!"}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🤖 AI Better Answer:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#eff6ff",
                borderLeft: "4px solid #4f46e5",
              }}>
                {result.aiBetterAnswer ||
                  "Not available"}
              </div>
            </div>
          </div>
        )}

        {/* ⏭️ CASE 2: Skipped */}
        {isCase2 && (
          <div>
            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🎤 Your Answer:
              </div>
              <div style={{
                ...styles.answerBox,
                color: "#9ca3af",
                fontStyle: "italic",
              }}>
                Not attempted — question was skipped
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🤖 AI Answer:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#eff6ff",
                borderLeft: "4px solid #4f46e5",
              }}>
                {result.aiBetterAnswer || "Not available"}
              </div>
            </div>

            {/* ✅ Study links for CS skipped questions */}
            {isCS && result.studyLinks?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  📚 Study Resources:
                </div>
                <div style={styles.studyLinksBox}>
                  {result.studyLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.studyLink}
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ⌛ CASE 3: Timed Out - Partial Answer */}
        {isCase3 && (
          <div>
            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🎤 Your Partial Answer:
              </div>
              <div style={styles.answerBox}>
                {result.userAnswer ||
                  "Partial answer not captured"}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                ✅ What You Got Right:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#f0fdf4",
                borderLeft: "4px solid #22c55e",
              }}>
                {result.whatYouGotRight ||
                  "Keep practicing!"}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                ❌ What You Missed:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#fef2f2",
                borderLeft: "4px solid #ef4444",
              }}>
                {result.whatYouMissed ||
                  "Answer was cut off"}
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🤖 AI Better Answer:
              </div>
              <div style={{
                ...styles.feedbackBox,
                backgroundColor: "#eff6ff",
                borderLeft: "4px solid #4f46e5",
              }}>
                {result.aiBetterAnswer ||
                  "Not available"}
              </div>
            </div>
          </div>
        )}

        {/* ❌ CASE 4: Timed Out - Nothing */}
        {isCase4 && (
          <div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🎤 Your Answer:
              </div>

              <div
                style={{
                  ...styles.answerBox,
                  color: "#9ca3af",
                  fontStyle: "italic",
                }}
              >
                No answer submitted.
                Time limit exceeded.
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                🤖 AI Better Answer:
              </div>

              <div
                style={{
                  ...styles.feedbackBox,
                  backgroundColor: "#eff6ff",
                  borderLeft: "4px solid #4f46e5",
                }}
              >
                {result.aiBetterAnswer || "Not available"}
              </div>
            </div>

            {isCS && result.studyLinks?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  📚 Study Resources:
                </div>

                <div style={styles.studyLinksBox}>
                  {result.studyLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.studyLink}
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    );
  };

  // ─────────────────────────────────────
  // Generate improvement plan
  // ─────────────────────────────────────
  const getImprovementPlan = () => {
    const skipped = questionResults.filter(
      (q) => q.status === "skipped"
    ).length;
    const timedOut = questionResults.filter(
      (q) => q.status.includes("timedout")
    ).length;
    const lowScore = questionResults.filter(
      (q) =>
        q.status === "submitted" && q.score < 50
    ).length;
    const avgScore = session?.totalScore || 0;

    const tips = [];

    if (avgScore < 50) {
      tips.push(
        "📚 Practice more — your overall score needs improvement"
      );
    }
    if (skipped > 0) {
      tips.push(
        `⏭️ You skipped ${skipped} question(s) — try to attempt all questions`
      );
    }
    if (timedOut > 0) {
      tips.push(
        `⌛ You timed out on ${timedOut} question(s) — practice speaking faster`
      );
    }
    if (lowScore > 0) {
      tips.push(
        `📝 ${lowScore} answer(s) scored below 50 — review the AI better answers`
      );
    }
    if (avgScore >= 70) {
      tips.push(
        "🌟 Great performance! Keep practicing to maintain consistency"
      );
    }
    if (avgScore >= 90) {
      tips.push(
        "🏆 Excellent! You are interview ready!"
      );
    }

    tips.push(
      "🔄 Use the retake option to practice same questions again"
    );

    return tips;
  };

  const getStatusText = (status) => {
    const texts = {
      submitted: "✅ Submitted",
      skipped: "⏭️ Skipped",
      "timedout-partial": "⌛ Timed Out (Partial)",
      "timedout-nothing": "❌ Timed Out (No Answer)",
    };
    return texts[status] || status;
  };

  const getStatusStyle = (status) => {
    const styles = {
      submitted: {
        backgroundColor: "#f0fdf4",
        color: "#166534",
      },
      skipped: {
        backgroundColor: "#fffbeb",
        color: "#92400e",
      },
      "timedout-partial": {
        backgroundColor: "#fef2f2",
        color: "#991b1b",
      },
      "timedout-nothing": {
        backgroundColor: "#fef2f2",
        color: "#991b1b",
      },
    };
    return styles[status] || {};
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        Loading report...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>InterviewAI</h1>
        <div style={styles.navRight}>
          <button
            style={styles.backBtn}
            onClick={() =>
              fromHistory
                ? navigate("/history")
                : navigate(-1)
            }
          >
            {fromHistory
              ? "← Back to History"
              : "← Back to Scorecard"}
          </button>
          <button
            style={styles.dashBtn}
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </button>
        </div>
      </div>

      <div style={styles.content}>

        {/* Header */}
        <div style={styles.reportHeader}>
          <h2 style={styles.heading}>
            📊 Detailed Report
          </h2>
          <div style={styles.reportMeta}>
            <span>
              {feature === "HR"
                ? "HR Interview"
                : `CS Quiz - ${session?.topic}`}
            </span>
            <span>•</span>
            <span>
              {new Date(
                session?.createdAt
              ).toLocaleDateString()}
            </span>
            <span>•</span>
            <span style={{
              color: session?.totalScore >= 70
                ? "#22c55e"
                : session?.totalScore >= 40
                ? "#f59e0b"
                : "#ef4444",
              fontWeight: "600",
            }}>
              {session?.totalScore}/100
            </span>
          </div>
        </div>

        {/* Summary */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryNum}>
              {questionResults.filter(
                (q) => q.status === "submitted"
              ).length}
            </div>
            <div style={styles.summaryLabel}>
              Submitted ✅
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryNum}>
              {questionResults.filter(
                (q) => q.status === "skipped"
              ).length}
            </div>
            <div style={styles.summaryLabel}>
              Skipped ⏭️
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryNum}>
              {questionResults.filter((q) =>
                q.status.includes("timedout")
              ).length}
            </div>
            <div style={styles.summaryLabel}>
              Timed Out ⌛
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={{
              ...styles.summaryNum,
              color: session?.totalScore >= 70
                ? "#22c55e"
                : "#ef4444",
            }}>
              {session?.totalScore}
            </div>
            <div style={styles.summaryLabel}>
              Total Score
            </div>
          </div>
        </div>

        {/* All Questions */}
        <h3 style={styles.sectionTitle}>
          Question by Question Analysis
        </h3>

        {questionResults.map((result, index) =>
          renderQuestion(result, index)
        )}

        {/* Overall Improvement Plan */}
        <div style={styles.improvementCard}>
          <h3 style={styles.improvementTitle}>
            📈 Overall Improvement Plan
          </h3>
          {getImprovementPlan().map((tip, i) => (
            <div key={i} style={styles.tipItem}>
              <span style={styles.tipDot}>→</span>
              {tip}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={styles.actionRow}>
          <button
            style={styles.backBtn2}
            onClick={() =>
              fromHistory
                ? navigate("/history")
                : navigate(-1)
            }
          >
            {fromHistory
              ? "← Back to History"
              : "← Back to Scorecard"}
          </button>
          <button
            style={styles.dashBtn2}
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </button>
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
  navRight: {
    display: "flex",
    gap: "1rem",
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
    maxWidth: "800px",
    margin: "0 auto",
  },
  reportHeader: {
    marginBottom: "1.5rem",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "0.5rem",
  },
  reportMeta: {
    display: "flex",
    gap: "0.75rem",
    fontSize: "14px",
    color: "#666",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "1rem",
  },
  summaryItem: {
    textAlign: "center",
  },
  summaryNum: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#666",
    marginTop: "0.25rem",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1rem",
  },
  questionCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
  },
  qHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  qLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  qNumber: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#4f46e5",
  },
  statusBadge: {
    fontSize: "12px",
    padding: "3px 10px",
    borderRadius: "20px",
    fontWeight: "500",
  },
  qScore: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  qText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1a1a2e",
    lineHeight: "1.6",
    marginBottom: "0.5rem",
  },
  timeInfo: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "0.75rem",
  },
  divider: {
    height: "1px",
    backgroundColor: "#f3f4f6",
    marginBottom: "1rem",
  },
  section: {
    marginBottom: "1rem",
  },
  sectionLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "0.5rem",
  },
  answerBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "14px",
    color: "#333",
    lineHeight: "1.6",
  },
  feedbackBox: {
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "14px",
    color: "#333",
    lineHeight: "1.6",
  },
  studyLinksBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  studyLink: {
    display: "block",
    marginBottom: "10px",
    padding: "12px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    color: "#2563eb",
    fontWeight: "600",
    textDecoration: "none",
    transition: "0.2s",
  },
  improvementCard: {
    backgroundColor: "#1a1a2e",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
  },
  improvementTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: "1rem",
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.5rem 0",
    fontSize: "14px",
    color: "#d1d5db",
    lineHeight: "1.5",
  },
  tipDot: {
    color: "#4f46e5",
    fontWeight: "bold",
    marginTop: "2px",
  },
  actionRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  backBtn2: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },
  dashBtn2: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Report;