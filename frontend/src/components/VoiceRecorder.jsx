import React, { useEffect, useRef, useState } from "react";

const VoiceRecorder = ({
  isRecording,
  onTextUpdate,
  onFinalText,
  onStop,
}) => {

  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  const transcriptRef = useRef("");
  const restartTimeoutRef = useRef(null);

  const isRecordingRef = useRef(false);
  const shouldStopRef = useRef(false);
  const isStartingRef = useRef(false);

  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Recognition Started");
      isStartingRef.current = false;
      setIsListening(true);
    };

    recognition.onresult = (event) => {

      let finalTranscript = "";
      let interimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += text + " ";
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
      }

      const full =
        transcriptRef.current + interimTranscript;

      setTranscript(full);

      if (onTextUpdate) {
        onTextUpdate(full);
      }
    };

    recognition.onerror = (event) => {

      console.log("Speech Error:", event.error);

      if (event.error === "not-allowed") {
        setError("Microphone permission denied.");
        return;
      }

      if (
        event.error === "aborted" ||
        event.error === "no-speech" ||
        event.error === "audio-capture"
      ) {
        return;
      }
    };

    recognition.onend = () => {

      console.log("Recognition Ended");

      setIsListening(false);
      isStartingRef.current = false;

      if (shouldStopRef.current) {

        const finalText = transcriptRef.current.trim();

        if (onFinalText)
          onFinalText(finalText);

        if (onStop)
          onStop(finalText);

        return;
      }

      if (isRecordingRef.current) {

        clearTimeout(restartTimeoutRef.current);

        restartTimeoutRef.current = setTimeout(() => {

          if (
            !isRecordingRef.current ||
            shouldStopRef.current
          )
            return;

          if (isStartingRef.current)
            return;

          try {

            isStartingRef.current = true;

            recognition.start();

          } catch (err) {

            isStartingRef.current = false;

            console.log("Restart:", err.message);

          }

        }, 250);

      }

    };

    recognitionRef.current = recognition;

    return () => {

      clearTimeout(restartTimeoutRef.current);

      try {
        recognition.stop();
      } catch {}

    };

  }, []);
    useEffect(() => {

    if (!recognitionRef.current) return;

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

  }, [isRecording]);

  const startRecording = () => {

    console.log("Starting Recording");

    clearTimeout(restartTimeoutRef.current);

    transcriptRef.current = "";
    setTranscript("");

    shouldStopRef.current = false;
    isRecordingRef.current = true;

    if (isListening || isStartingRef.current) return;

    try {

      isStartingRef.current = true;

      recognitionRef.current.start();

    } catch (err) {

      isStartingRef.current = false;

      console.log(err.message);

    }

  };

  const stopRecording = () => {

    console.log("Stopping Recording");

    clearTimeout(restartTimeoutRef.current);

    shouldStopRef.current = true;
    isRecordingRef.current = false;

    if (!isListening) {

      const finalText = transcriptRef.current.trim();

      if (onFinalText)
        onFinalText(finalText);

      if (onStop)
        onStop(finalText);

      return;

    }

    try {

      recognitionRef.current.stop();

    } catch (err) {

      console.log(err.message);

    }

  };

  return (

    <div style={styles.container}>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.statusRow}>

        {isListening ? (

          <div style={styles.recordingStatus}>
            <div style={styles.dot}></div>
            <span>Recording...</span>
          </div>

        ) : isRecording ? (

          <div style={styles.restartingStatus}>
            Restarting microphone...
          </div>

        ) : null}

      </div>

      <div style={styles.transcriptBox}>

        {transcript ? transcript :

          <span style={styles.placeholder}>

            {isRecording
              ? "Speak now..."
              : "Transcript will appear here"}

          </span>

        }

      </div>

    </div>

  );

};

const styles = {

  container: {
    width: "100%",
  },

  error: {
    backgroundColor: "#ffe0e0",
    color: "#cc0000",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px",
  },

  statusRow: {
    minHeight: "24px",
    marginBottom: "8px",
  },

  recordingStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#ef4444",
    fontWeight: "600",
  },

  restartingStatus: {
    color: "#f59e0b",
    fontWeight: "600",
  },

  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
  },

  transcriptBox: {
    minHeight: "140px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "12px",
    background: "#fafafa",
    lineHeight: "1.6",
  },

  placeholder: {
    color: "#999",
  }

};

export default VoiceRecorder;