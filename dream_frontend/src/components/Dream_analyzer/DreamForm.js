import "./DreamForm.css";
import React, { useState, useRef } from "react";



function DreamForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef(null);
  const autoRestartRef = useRef(false); // auto-restart if Chrome stops on silence

  // Initialize Web Speech API
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true; // stay active until manually stopped
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    return recognition;
  };

  const startRecognition = () => {
    const recognition = initSpeechRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setIsRecording(true);
    setMessage("🎙️ Listening... Speak your dream");

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript.trim()) {
        setContent((prev) =>
          (prev + " " + finalTranscript.trim()).replace(/\s+/g, " ")
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setMessage("Mic error — try again.");
      setIsRecording(false);
      autoRestartRef.current = false;
    };

    recognition.onend = () => {
      if (isRecording && autoRestartRef.current) {
        recognition.start(); // auto-restart on silence
      } else {
        setIsRecording(false);
        setMessage("Stopped listening.");
        setTimeout(() => setMessage(""), 1500);
      }
    };

    autoRestartRef.current = true;
    recognition.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      autoRestartRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
      setMessage("Stopped listening.");
      setTimeout(() => setMessage(""), 1500);
    }
  };

  const handleMicClick = () => {
    if (isRecording) stopRecognition();
    else startRecognition();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      setMessage("Title and content are required.");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await onAdd({ title, content, mood });
      setTitle("");
      setContent("");
      setMood("");
      setMessage("Dream saved!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error saving dream:", err);
      setMessage("Error saving dream.");
      setTimeout(() => setMessage(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTitle("");
    setContent("");
    setMood("");
    setMessage("Cleared form.");
    setTimeout(() => setMessage(""), 1500);
  };

  return (
    <div className="dream-form-container">
      <h2 className="dream-form-title">Add Your Dream</h2>

      <form onSubmit={handleSubmit} className="dream-form">
        <input
          type="text"
          placeholder="Dream title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="dream-input"
        />

        <textarea
          placeholder="Write or speak your dream..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="dream-textarea"
        />

        <input
          type="text"
          placeholder="Mood (optional)"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="dream-input"
        />

        {/* Button Row */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <button type="submit" className="dream-button" disabled={loading}>
            {loading ? "Saving..." : "Save Dream"}
          </button>

          <button
            type="button"
            onClick={handleMicClick}
            className={`dream-button mic-button ${isRecording ? "recording" : ""}`}
          >
            {isRecording ? "🛑 Stop" : "🎤 Speak"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="dream-button"
            style={{
              background: "linear-gradient(to right, #424242, #212121)",
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {loading && <div className="loader"></div>}
      {message && <p className="dream-message">{message}</p>}
    </div>
  );
}

export default DreamForm;
