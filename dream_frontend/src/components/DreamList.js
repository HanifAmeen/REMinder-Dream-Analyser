import React, { useState } from "react";
import "./DreamList.css";

function DreamList({ dreams, onDelete }) {
  const capitalize = (str) =>
    str && typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : str;

  const [showInsightsMap, setShowInsightsMap] = useState({});
  const [showSymbolsMap, setShowSymbolsMap] = useState({});

  const toggleSection = (mapSetter, key) => {
    mapSetter((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="dream-list-container">
      <h2 className="dream-list-title">Your Dreams</h2>
      {dreams.length === 0 && <p className="no-dreams">No dreams recorded yet.</p>}

      {dreams.map((dream) => (
        <div key={dream.id} className="dream-card">
          {/* Header */}
          <div className="dream-card-header">
            <strong>{dream.title || "Untitled Dream"}</strong> ({dream.date})
            <button className="delete-button" onClick={() => onDelete(dream.id)}>
              Delete
            </button>
          </div>

          {/* Summary */}
          {dream.summary && (
            <p className="dream-summary">
              <strong>🪶 Summary:</strong> {dream.summary}
            </p>
          )}

          {/* Mood / Emotion */}
          {dream.emotions && (
            <p>
              <strong>Dominant Emotion:</strong>{" "}
              {capitalize(dream.emotions.dominant) || dream.mood || "N/A"}
            </p>
          )}

          {/* Archetype */}
          {dream.archetype && (
            <p>
              <strong>Archetype:</strong> {capitalize(dream.archetype)}
            </p>
          )}

          {/* Coherence Score */}
          {dream.coherence_score && (
            <p>
              <strong>Coherence Score:</strong> {dream.coherence_score}%
            </p>
          )}

          {/* Themes */}
          {dream.themes && dream.themes.length > 0 && (
            <p className="dream-themes">
              <strong>Themes:</strong>{" "}
              {Array.isArray(dream.themes)
                ? dream.themes.join(", ")
                : dream.themes}
            </p>
          )}

          {/* Recurring Symbols */}
          {dream.recurring_symbols && dream.recurring_symbols.length > 0 && (
            <p className="dream-recurring">
              🔁 <strong>Recurring Symbols:</strong>{" "}
              {dream.recurring_symbols.map(capitalize).join(", ")}
            </p>
          )}

          {/* Content */}
          {dream.content && (
            <p className="dream-content">
              <strong>Dream Content:</strong> {dream.content}
            </p>
          )}

          {/* SYMBOLS DROPDOWN */}
          {dream.symbols && dream.symbols.length > 0 && (
            <div className="dream-symbols-section">
              <button
                className="toggle-insights-button"
                onClick={() => toggleSection(setShowSymbolsMap, `symbols-${dream.id}`)}
              >
                {showSymbolsMap[`symbols-${dream.id}`]
                  ? "Hide Symbols"
                  : "Show Symbols Detected"}
              </button>

              {showSymbolsMap[`symbols-${dream.id}`] && (
                <div className="dream-symbols-box">
                  <ul>
                    {dream.symbols.map((s, idx) => (
                      <li key={idx}>
                        🜂 <strong>{capitalize(s.symbol)}</strong> → {s.meaning}
                      </li>
                    ))}
                  </ul>
                  <p>✅ Total symbols matched: {dream.symbols.length}</p>
                </div>
              )}
            </div>
          )}

          {/* HOLISTIC INSIGHT DROPDOWN */}
          {dream.combined_insights && dream.combined_insights.length > 0 && (
            <div className="dream-combined-insights">
              <button
                className="toggle-insights-button"
                onClick={() => toggleSection(setShowInsightsMap, `insight-${dream.id}`)}
              >
                {showInsightsMap[`insight-${dream.id}`]
                  ? "Hide Dream Insight"
                  : "Show Overall Symbol Insight"}
              </button>

              {showInsightsMap[`insight-${dream.id}`] && (
                <div className="insights-content">
                  {/* Only show one holistic insight */}
                  <p>
                    💭 <strong>Holistic Interpretation:</strong>{" "}
                    {dream.combined_insights[0].insight}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DreamList;
