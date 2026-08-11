// pages/Signup.jsx
// Signup page UI + API connection

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phoneNumber: "",
  });

  // Error and loading state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call signup API
      const response = await axios.post(
        "https://interviewai-backend-x3r5.onrender.com/api/auth/signup",
        formData
      );

      // Save token and user to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message || "Signup failed! Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <h1 style={styles.title}>InterviewAI</h1>
        <p style={styles.subtitle}>Create your account</p>

        {/* Error message */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={styles.input}
              required
            />
          </div>

          {/* Username */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              style={styles.input}
              required
            />
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              style={styles.input}
              required
            />
          </div>

          {/* Phone Number */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              style={styles.input}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Login Link */}
        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#1a1a2e",
    marginBottom: "0.5rem",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: "1.5rem",
  },
  error: {
    backgroundColor: "#ffe0e0",
    color: "#cc0000",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "14px",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "500",
    color: "#333",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  link: {
    textAlign: "center",
    marginTop: "1rem",
    fontSize: "14px",
    color: "#666",
  },
  linkText: {
    color: "#4f46e5",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Signup;