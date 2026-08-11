// pages/Dashboard.jsx
// Main dashboard with resume upload and feature cards

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Resume state
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showChangeResume, setShowChangeResume] = useState(false);

  // Axios config with token
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch saved resume on load
  useEffect(() => {
    fetchResume();
  }, []);

  // Fetch resume from backend
  const fetchResume = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/resume/get",
        config
      );
      setResume(response.data.resume);
    } catch (error) {
      // No resume found is ok
      setResume(null);
    }
  };

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if PDF
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file only!");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await axios.post(
        "http://localhost:5000/api/resume/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadSuccess("Resume uploaded successfully!");
      setShowChangeResume(false);
      fetchResume(); // Refresh resume data
    } catch (error) {
      setUploadError("Error uploading resume. Try again!");
    } finally {
      setUploading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={styles.container}>

      {/* Navbar */}
      <div style={styles.navbar}>
        <h1 style={styles.logo}>InterviewAI</h1>
        <div style={styles.navRight}>
          <span style={styles.username}>Hello, {user?.name}!</span>
          <button
            style={styles.historyBtn}
            onClick={() => navigate("/history")}
          >
            📚 History
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>

        {/* Resume Section */}
        <div style={styles.resumeSection}>
          <h2 style={styles.sectionTitle}>Your Resume</h2>

          {/* Show saved resume */}
          {resume && !showChangeResume ? (
            <div style={styles.resumeCard}>
              <div style={styles.resumeInfo}>
                <span style={styles.resumeIcon}>📄</span>
                <div>
                  <div style={styles.resumeName}>
                    {resume.fileName}
                  </div>
                  <div style={styles.resumeDate}>
                    Uploaded on{" "}
                    {new Date(resume.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                style={styles.changeBtn}
                onClick={() => setShowChangeResume(true)}
              >
                Change Resume
              </button>
            </div>
          ) : (
            /* Show upload section */
            <div style={styles.uploadSection}>
              {uploadError && (
                <div style={styles.error}>{uploadError}</div>
              )}
              {uploadSuccess && (
                <div style={styles.success}>{uploadSuccess}</div>
              )}
              <label style={styles.uploadLabel}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  style={{ display: "none" }}
                />
                <div style={styles.uploadBox}>
                  {uploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <span style={styles.uploadIcon}>📤</span>
                      <span>
                        {resume
                          ? "Click to change resume"
                          : "Click to upload resume (PDF)"}
                      </span>
                    </>
                  )}
                </div>
              </label>
              {showChangeResume && (
                <button
                  style={styles.cancelBtn}
                  onClick={() => setShowChangeResume(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <h2 style={styles.sectionTitle}>
          What do you want to practice today?
        </h2>
        <div style={styles.cardGrid}>

          {/* Feature 1: Resume Analyzer */}
          <div style={styles.featureCard}>
            <div style={styles.cardIcon}>📄</div>
            <h3 style={styles.cardTitle}>Resume Analyzer</h3>
            <p style={styles.cardDesc}>
              Upload resume + job description and get
              ATS score, skill gaps and suggestions
            </p>
            <button
              style={styles.cardBtn}
              onClick={() => navigate("/resume-analyzer")}
            >
              Open
            </button>
          </div>

          {/* Feature 2: HR Interview */}
          <div style={styles.featureCard}>
            <div style={styles.cardIcon}>🎤</div>
            <h3 style={styles.cardTitle}>HR Interview</h3>
            <p style={styles.cardDesc}>
              Practice personalized HR questions
              generated from your resume with
              voice answers
            </p>
            <button
              style={
                resume
                  ? styles.cardBtn
                  : styles.cardBtnDisabled
              }
              onClick={() =>
                resume
                  ? navigate("/hr-interview")
                  : alert("Please upload your resume first!")
              }
            >
              {resume ? "Open" : "Upload Resume First"}
            </button>
          </div>

          {/* Feature 3: CS Quiz */}
          <div style={styles.featureCard}>
            <div style={styles.cardIcon}>💻</div>
            <h3 style={styles.cardTitle}>CS Quiz</h3>
            <p style={styles.cardDesc}>
              Practice core CS concepts — DBMS,
              CN, OOPs and OS with AI evaluation
            </p>
            <button
              style={styles.cardBtn}
              onClick={() => navigate("/cs-quiz")}
            >
              Open
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// Styles
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
    alignItems: "center",
    gap: "1rem",
  },
  username: {
    fontSize: "14px",
    color: "#333",
  },
  historyBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#ff4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  content: {
    padding: "2rem",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  resumeSection: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "1rem",
  },
  resumeCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #e0e0ff",
  },
  resumeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  resumeIcon: {
    fontSize: "32px",
  },
  resumeName: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#333",
  },
  resumeDate: {
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  },
  changeBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  uploadSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  uploadLabel: {
    cursor: "pointer",
  },
  uploadBox: {
    border: "2px dashed #4f46e5",
    borderRadius: "8px",
    padding: "2rem",
    textAlign: "center",
    color: "#4f46e5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "14px",
  },
  uploadIcon: {
    fontSize: "32px",
  },
  cancelBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#ffffff",
    color: "#888",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    alignSelf: "flex-start",
  },
  error: {
    backgroundColor: "#ffe0e0",
    color: "#cc0000",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "14px",
  },
  success: {
    backgroundColor: "#e0ffe0",
    color: "#006600",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "14px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  featureCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  cardIcon: {
    fontSize: "32px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a2e",
  },
  cardDesc: {
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.5",
    flex: 1,
  },
  cardBtn: {
    padding: "0.5rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  cardBtnDisabled: {
    padding: "0.5rem",
    backgroundColor: "#cccccc",
    color: "#666666",
    border: "none",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontSize: "13px",
    fontWeight: "500",
  },
};

export default Dashboard;