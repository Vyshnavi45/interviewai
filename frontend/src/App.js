import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import HRSetup from "./pages/HRSetup";
import TestPage from "./pages/TestPage";
import Scorecard from "./pages/Scorecard";
import VoiceTest from "./pages/VoiceTest";
import TimerTest from "./pages/TimerTest";
import Report from "./pages/Report";
import CSSetup from "./pages/CSSetup";
import History from "./pages/History";
import RetakeSetup from "./pages/RetakeSetup";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resume-analyzer" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
        <Route path="/hr-interview" element={<ProtectedRoute><HRSetup /></ProtectedRoute>} />
        <Route path="/hr-test" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
        <Route path="/scorecard" element={<ProtectedRoute><Scorecard /></ProtectedRoute>} />
        <Route path="/voice-test" element={<ProtectedRoute><VoiceTest /></ProtectedRoute>} />
        <Route path="/timer-test" element={<ProtectedRoute><TimerTest /></ProtectedRoute>} />
        <Route
  path="/cs-quiz"
  element={
    <ProtectedRoute>
      <CSSetup />
    </ProtectedRoute>
  }
/>

        {/* Placeholders */}
        <Route
  path="/cs-test"
  element={
    <ProtectedRoute>
      <TestPage />
    </ProtectedRoute>
  }
/>
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />

        <Route
          path="/retake"
          element={
            <ProtectedRoute>
              <RetakeSetup />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;