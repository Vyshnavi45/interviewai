// components/Timer.jsx
// Countdown timer for reading and answer time

import React, { useState, useEffect, useRef } from "react";

const Timer = ({
timeLimit,      // Time in seconds
onTimeout,      // Called when timer reaches 0
isActive,       // Controls if timer is running
onTick,         // Called every second with remaining time
timerType,      // "reading" or "answer"
}) => {
const [timeLeft, setTimeLeft] = useState(timeLimit);
const [percentage, setPercentage] = useState(100);
const intervalRef = useRef(null);

// Reset timer when timeLimit changes
useEffect(() => {
setTimeLeft(timeLimit);
setPercentage(100);
}, [timeLimit]);

// Start/stop timer based on isActive
useEffect(() => {
if (isActive) {
startTimer();
} else {
stopTimer();
}

return () => stopTimer();
}, [isActive]);

const startTimer = () => {
stopTimer(); // Clear any existing timer

intervalRef.current = setInterval(() => {
  setTimeLeft((prev) => {
    const newTime = prev - 1;

    // Update percentage
    const newPercentage = (newTime / timeLimit) * 100;
    setPercentage(newPercentage);

    // Call onTick with remaining time
    if (onTick) onTick(newTime);

    // Timer ended!
    if (newTime <= 0) {
      stopTimer();
      if (onTimeout) onTimeout();
      return 0;
    }

    return newTime;
  });
}, 1000);

};

const stopTimer = () => {
if (intervalRef.current) {
clearInterval(intervalRef.current);
intervalRef.current = null;
}
};

// Format time as MM\:SS
const formatTime = (seconds) => {
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Get color based on time left
const getColor = () => {
if (percentage > 50) return "#22c55e"; // Green
if (percentage > 25) return "#f59e0b"; // Yellow
return "#ef4444"; // Red
};

return (
<div style={styles.container}>
  {/* Timer Label */}
  <div style={styles.labelRow}>
    <span style={styles.label}>
      {timerType === "reading"
        ? "📖 Reading time"
        : "🎤 Answer time"}
    </span>
    <span
      style={{
        ...styles.timeText,
        color: getColor(),
      }}
    >
      {formatTime(timeLeft)}
    </span>
  </div>

  {/* Progress Bar */}
  <div style={styles.progressBar}>
    <div
      style={{
        ...styles.progressFill,
        width: `${percentage}%`,
        backgroundColor: getColor(),
        transition: "width 1s linear, background-color 0.3s",
      }}
    />
  </div>

  {/* Warning when less than 30 seconds */}
  {timeLeft <= 30 && timeLeft > 0 && (
    <div style={styles.warning}>
      ⚠️ Less than 30 seconds remaining!
    </div>
  )}
</div>
);
};

const styles = {
container: {
width: "100%",
marginBottom: "1rem",
},
labelRow: {
display: "flex",
justifyContent: "space-between",
alignItems: "center",
marginBottom: "0.5rem",
},
label: {
fontSize: "13px",
color: "#666",
fontWeight: "500",
},
timeText: {
fontSize: "16px",
fontWeight: "bold",
},
progressBar: {
height: "8px",
backgroundColor: "#e5e7eb",
borderRadius: "4px",
overflow: "hidden",
},
progressFill: {
height: "100%",
borderRadius: "4px",
},
warning: {
marginTop: "0.5rem",
fontSize: "12px",
color: "#ef4444",
fontWeight: "500",
},
};

export default Timer;