import React, { useState } from "react";
import "./DreamForm.css";

function DreamForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // 👈 added loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({ title, content, mood });
    setLoading(false);
    setTitle("");
    setContent("");
    setMood("");
    setMessage("Dream saved!");
    setTimeout(() => setMessage(""), 2000);
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
          placeholder="Write your dream..."
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
        <button
          type="submit"
          className="dream-button"
          disabled={loading} // 👈 disables while saving
        >
          {loading ? "Saving..." : "Save Dream"}
        </button>
      </form>

      {loading && <div className="loader"></div>} {/* 👈 new spinner */}

      {message && <p className="dream-message">{message}</p>}
    </div>
  );
}

export default DreamForm;
