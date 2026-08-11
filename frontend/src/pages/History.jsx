// pages/History.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const History = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const [activeTab, setActiveTab] = useState("HR");
  const [hrSessions, setHrSessions] = useState([]);
  const [csSessions, setCsSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csFilter, setCsFilter] = useState("All");

  const CS_TOPICS = ["All", "DBMS", "CN", "OOPs", "OS"];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const [hrRes, csRes] = await Promise.all([
        axios.get(
          "http://localhost:5000/api/history/hr",
          config
        ),
        axios.get(
          "http://localhost:5000/api/history/cs",
          config
        ),
      ]);

      setHrSessions(hrRes.data.sessions);
      setCsSessions(csRes.data.sessions);
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getRetakesLeft = (session) => {
    return session.maxRetakes - session.retakesUsed;
  };

  // Filter CS sessions by topic
  const filteredCSSessions =
    csFilter === "All"
      ? csSessions
      : csSessions.filter(
          (s) =>
            s.topic?.trim().toUpperCase() ===
            csFilter.trim().toUpperCase()
        );

  // ─────────────────────────────────────
  // Session Card Component
  // ─────────────────────────────────────
  const SessionCard = ({
    session,
    isRetake = false,
    feature,
  }) => {
    const retakesLeft = getRetakesLeft(session);
    const attempted = session.totalQuestions;

    return (
      <div
        style={{
          ...styles.sessionCard,
          ...(isRetake ? styles.retakeCard : {}),
        }}
      >
        {/* Card Header */}
        <div style={styles.cardHeader}>
          <div style={styles.cardLeft}>
            {isRetake && (
              <span style={styles.retakeBadge}>
                🔄 Retake {session.attemptNumber - 1}
              </span>
            )}
            <div style={styles.cardDate}>
              📅 {formatDate(session.createdAt)}
            </div>
            <div style={styles.cardMeta}>
              {feature === "CS" && (
                <span style={styles.topicBadge}>
                  {session.topic}
                </span>
              )}
              <span style={styles.modeBadge}>
                {session.mode === "timer"
                  ? "⏱️ Timer"
                  : "🕐 No Timer"}
              </span>
              <span style={styles.questionsBadge}>
                {session.totalQuestions} questions
              </span>
            </div>
          </div>

          {/* Score */}
          <div
            style={{
              ...styles.scoreCircle,
              borderColor: getScoreColor(
                session.totalScore
              ),
            }}
          >
            <span
              style={{
                ...styles.scoreText,
                color: getScoreColor(session.totalScore),
              }}
            >
              {session.totalScore}
            </span>
            <span style={styles.scoreMax}>/100</span>
          </div>
        </div>

        {/* Retakes Info */}
        {!isRetake && (
          <div style={styles.retakesInfo}>
            {retakesLeft > 0 ? (
              <span style={styles.retakesLeft}>
                🔄 {retakesLeft} retake
                {retakesLeft > 1 ? "s" : ""} remaining
              </span>
            ) : (
              <span style={styles.noRetakes}>
                ❌ No retakes remaining
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.cardBtns}>
          <button
            style={styles.reportBtn}
            onClick={() =>
              navigate("/report", {
                state: {
                  sessionId: session._id,
                  feature,
                  fromHistory: true,
                },
              })
            }
          >
            👁️ View Report
          </button>

          {!isRetake && retakesLeft > 0 && (
            <button
              style={styles.retakeBtn}
              onClick={() =>
                navigate("/retake", {
                  state: {
                    parentSessionId: session._id,
                    questions: session.questions,
                    topic: session.topic,
                    feature,
                    retakesUsed: session.retakesUsed,
                  },
                })
              }
            >
              🔄 Retake
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────
  // Session Group (parent + retakes)
  // ─────────────────────────────────────
  const SessionGroup = ({ session, feature }) => (
    <div style={styles.sessionGroup}>
      {/* Parent Session */}
      <div style={styles.parentLabel}>
        🆕 New Test {session.attemptNumber || 1}
      </div>
      <SessionCard
        session={session}
        feature={feature}
      />

      {/* Retakes */}
      {session.retakes?.length > 0 && (
        <div style={styles.retakesContainer}>
          {session.retakes.map((retake, i) => (
            <div key={retake._id}>
              <div style={styles.retakeConnector} />
              <SessionCard
                session={retake}
                isRetake={true}
                feature={feature}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading history...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>InterviewAI</h1>
        <button
          style={styles.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.heading}>📚 My History</h2>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "HR"
                ? styles.tabActive
                : {}),
            }}
            onClick={() => setActiveTab("HR")}
          >
            👔 HR Tests
            {hrSessions.length > 0 && (
              <span style={styles.tabCount}>
                {hrSessions.length}
              </span>
            )}
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "CS"
                ? styles.tabActive
                : {}),
            }}
            onClick={() => setActiveTab("CS")}
          >
            💻 CS Tests
            {csSessions.length > 0 && (
              <span style={styles.tabCount}>
                {csSessions.length}
              </span>
            )}
          </button>
        </div>

        {/* HR Tab Content */}
        {activeTab === "HR" && (
          <div>
            {hrSessions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <div style={styles.emptyTitle}>
                  No HR tests yet!
                </div>
                <div style={styles.emptyDesc}>
                  Take your first HR interview to
                  see history here
                </div>
                <button
                  style={styles.startBtn}
                  onClick={() =>
                    navigate("/hr-interview")
                  }
                >
                  Start HR Interview
                </button>
              </div>
            ) : (
              hrSessions.map((session) => (
                <SessionGroup
                  key={session._id}
                  session={session}
                  feature="HR"
                />
              ))
            )}
          </div>
        )}

        {/* CS Tab Content */}
        {activeTab === "CS" && (
          <div>
            {/* Topic Filter */}
            <div style={styles.filterRow}>
              {CS_TOPICS.map((topic) => (
                <button
                  key={topic}
                  style={{
                    ...styles.filterBtn,
                    ...(csFilter === topic
                      ? styles.filterBtnActive
                      : {}),
                  }}
                  onClick={() => setCsFilter(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            {filteredCSSessions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <div style={styles.emptyTitle}>
                  No CS tests yet!
                </div>
                <div style={styles.emptyDesc}>
                  Take your first CS quiz to see
                  history here
                </div>
                <button
                  style={styles.startBtn}
                  onClick={() => navigate("/cs-quiz")}
                >
                  Start CS Quiz
                </button>
              </div>
            ) : (
              filteredCSSessions.map((session) => (
                <SessionGroup
                  key={session._id}
                  session={session}
                  feature="CS"
                />
              ))
            )}
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
  tabs: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    backgroundColor: "#ffffff",
    padding: "0.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  tab: {
    flex: 1,
    padding: "0.75rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    backgroundColor: "transparent",
    color: "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  tabActive: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
  },
  tabCount: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "12px",
  },
  filterRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "0.4rem 1rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    backgroundColor: "#ffffff",
    color: "#666",
    fontWeight: "500",
  },
  filterBtnActive: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    borderColor: "#4f46e5",
  },
  sessionGroup: {
    marginBottom: "2rem",
  },
  parentLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#4f46e5",
    marginBottom: "0.5rem",
    padding: "0 0.5rem",
  },
  sessionCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "0.5rem",
  },
  retakeCard: {
    backgroundColor: "#f8faff",
    border: "1px dashed #bfdbfe",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.75rem",
  },
  cardLeft: {
    flex: 1,
  },
  retakeBadge: {
    fontSize: "12px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "2px 8px",
    borderRadius: "20px",
    display: "inline-block",
    marginBottom: "0.35rem",
  },
  cardDate: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a2e",
    marginBottom: "0.35rem",
  },
  cardMeta: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  topicBadge: {
    fontSize: "11px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "2px 8px",
    borderRadius: "20px",
    fontWeight: "500",
  },
  modeBadge: {
    fontSize: "11px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    padding: "2px 8px",
    borderRadius: "20px",
  },
  questionsBadge: {
    fontSize: "11px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    padding: "2px 8px",
    borderRadius: "20px",
  },
  scoreCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "3px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scoreText: {
    fontSize: "18px",
    fontWeight: "bold",
    lineHeight: "1",
  },
  scoreMax: {
    fontSize: "10px",
    color: "#9ca3af",
  },
  retakesInfo: {
    marginBottom: "0.75rem",
  },
  retakesLeft: {
    fontSize: "12px",
    color: "#166534",
    backgroundColor: "#f0fdf4",
    padding: "3px 10px",
    borderRadius: "20px",
  },
  noRetakes: {
    fontSize: "12px",
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    padding: "3px 10px",
    borderRadius: "20px",
  },
  cardBtns: {
    display: "flex",
    gap: "0.75rem",
  },
  reportBtn: {
    flex: 1,
    padding: "0.5rem",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
  retakeBtn: {
    flex: 1,
    padding: "0.5rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
  retakesContainer: {
    paddingLeft: "1.5rem",
  },
  retakeConnector: {
    width: "2px",
    height: "12px",
    backgroundColor: "#bfdbfe",
    marginLeft: "1rem",
    marginBottom: "0",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "0.5rem",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "1.5rem",
  },
  startBtn: {
    padding: "0.75rem 2rem",
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

export default History;