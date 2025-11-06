import React, { useState } from "react";
import "./DreamList.css";

function DreamList({ dreams, onDelete }) {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Track which dream's insights are expanded
  const [showInsightsMap, setShowInsightsMap] = useState({});

  const toggleInsights = (id) => {
    setShowInsightsMap((prev) => ({
      ...prev,
      [id]: !prev[id],
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
            <strong>{dream.title}</strong> ({dream.date})
            <button className="delete-button" onClick={() => onDelete(dream.id)}>
              Delete
            </button>
          </div>

          {/* Mood */}
          <p>
            <strong>Mood:</strong> {dream.mood || "N/A"}
          </p>

          {/* Themes */}
          {dream.themes && (
            <p className="dream-themes">
              <strong>Themes:</strong> {dream.themes}
            </p>
          )}

          {/* Content */}
          <p>{dream.content}</p>

          {/* Symbols */}
          {dream.symbols && dream.symbols.length > 0 && (
            <div className="dream-symbols-box">
              <strong>🔮 Symbols found in dream:</strong>
              <ul>
                {dream.symbols.map((s, idx) => (
                  <li key={idx}>
                    🜂 {capitalize(s.symbol)} → {s.meaning}
                  </li>
                ))}
              </ul>
              <p>✅ Total symbols matched: {dream.symbols.length}</p>
            </div>
          )}

          {/* Combined Symbol Insights */}
          {dream.combined_insights && dream.combined_insights.length > 0 && (
            <div className="dream-combined-insights">
              <button
                className="toggle-insights-button"
                onClick={() => toggleInsights(`combined-${dream.id}`)}
              >
                {showInsightsMap[`combined-${dream.id}`]
                  ? "Hide Combined Insights"
                  : "Show Combined Insights"}
              </button>

              {showInsightsMap[`combined-${dream.id}`] && (
                <div className="insights-content">
                  {dream.combined_insights.map((ci, idx) => (
                    <p key={idx}>
                      💭 {capitalize(ci.symbols.join(" + "))}: {ci.insight}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recurring Motifs */}
          {dream.motifs && dream.motifs.length > 0 && (
            <p className="dream-motifs">
              🔁 Recurring Motifs: {dream.motifs.map((m) => capitalize(m)).join(", ")}
            </p>
          )}

          {/* Interpretations */}
          {dream.interpretations && dream.interpretations.length > 0 && (
            <div className="dream-interpretations">
              <button
                className="toggle-insights-button"
                onClick={() => toggleInsights(dream.id)}
              >
                {showInsightsMap[dream.id] ? "Hide Insights" : "Show Insights"}
              </button>

              {showInsightsMap[dream.id] && (
                <div className="insights-content">
                  {dream.interpretations.map((i, idx) => (
                    <p key={idx}>
                      💡 {capitalize(i.symbol)} → {i.meaning}
                    </p>
                  ))}
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
