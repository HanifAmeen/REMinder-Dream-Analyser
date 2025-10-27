import React from "react";
import "./DreamList.css";

function DreamList({ dreams, onDelete }) {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
          <pre className="dream-symbols">
            {dream.symbols && dream.symbols.length > 0
              ? `🔮 Symbols found in dream:\n${dream.symbols
                  .map((s) => `🜂 ${capitalize(s.symbol)} → ${s.interpretation}`)
                  .join("\n")}\n\n✅ Total symbols matched: ${dream.symbols.length}`
              : "No dream symbols detected."}
          </pre>
        </div>
      ))}
    </div>
  );
}

export default DreamList;
