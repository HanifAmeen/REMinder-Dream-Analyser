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
          <div className="dream-card-header">
            <strong>{dream.title}</strong> ({dream.date})
            <button className="delete-button" onClick={() => onDelete(dream.id)}>
              Delete
            </button>
          </div>

          <p><strong>Mood:</strong> {dream.mood || "N/A"}</p>

          {dream.themes && (
            <p className="dream-themes"><strong>Themes:</strong> {dream.themes}</p>
          )}

          <p>{dream.content}</p>

          {/* Symbols */}
          <pre className="dream-symbols">
            {dream.symbols && dream.symbols.length > 0
              ? `🔮 Symbols found in dream:\n${dream.symbols
                  .map((s) => `🜂 ${capitalize(s.symbol)} → ${s.meaning}`)
                  .join("\n")}\n\n✅ Total symbols matched: ${dream.symbols.length}`
              : "No dream symbols detected."}
          </pre>

          {/* Motifs */}
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
                <pre>
                  {dream.interpretations
                    .map((i) => `💡 ${capitalize(i.symbol)} → ${i.meaning}`)
                    .join("\n")}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DreamList;
