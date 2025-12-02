import React, { useState } from "react";
import "./DreamList.css";

export default function DreamList({ dreams, onDelete }) {
  const [open, setOpen] = useState({});
  const [symbolSortMode, setSymbolSortMode] = useState("weight"); // global sort

  const toggle = (id, key) => {
    const k = `${id}-${key}`;
    setOpen((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const cap = (str) =>
    str && typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : str;

  const sortSymbols = (arr) => {
    if (!arr) return [];
    if (symbolSortMode === "alpha") {
      return [...arr].sort((a, b) =>
        (a.symbol || "").localeCompare(b.symbol || "")
      );
    }
    return [...arr].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  };

  const renderThemes = (themes) => {
    if (!themes) return null;
    if (Array.isArray(themes)) return themes.join(", ");
    if (typeof themes === "string") return themes;
    return JSON.stringify(themes);
  };

  const renderEntities = (entities) => {
    if (!entities) return null;
    if (Array.isArray(entities)) {
      return entities
        .map((e) => {
          if (!e) return null;
          if (typeof e === "string") return e;
          if (typeof e === "object") return e.text || e.name || JSON.stringify(e);
          return String(e);
        })
        .filter(Boolean)
        .join(", ");
    }
    return String(entities);
  };

  const renderList = (list) => {
    if (!list) return null;
    if (Array.isArray(list)) return list.join(", ");
    return String(list);
  };

  const renderCauseEffect = (ce) => {
    if (!ce) return null;

    if (Array.isArray(ce)) {
      return ce
        .map((item) => {
          if (!item) return "";
          if (typeof item === "string") return item;

          if (typeof item === "object") {
            const cause =
              item.cause || item.left || item.from || item.trigger_phrase || null;
            const effect =
              item.effect || item.right || item.to || null;
            if (cause && effect) return `${cause} → ${effect}`;
            return Object.values(item).join(" → ");
          }
          return String(item);
        })
        .filter(Boolean)
        .join(", ");
    }

    return String(ce);
  };

  return (
    <div className="dream-list-container">
      <h2 className="dream-list-title">Your Dreams</h2>

      {(!dreams || dreams.length === 0) && (
        <p className="no-dreams">No dreams recorded yet.</p>
      )}

      {dreams.map((dream) => {
        const id = dream.id;

        const themesStr = renderThemes(dream.themes);
        const entitiesStr = renderEntities(dream.entities);
        const peopleStr = renderList(dream.people);
        const locationsStr = renderList(dream.locations);
        const objectsStr = renderList(dream.objects);
        const causeEffectStr = renderCauseEffect(dream.cause_effect);
        const conflictsStr = renderList(dream.conflicts);
        const desiresStr = renderList(dream.desires);

        const narrative =
          dream.narrative && typeof dream.narrative === "object"
            ? dream.narrative
            : null;

        // NEW BUCKETS (may be empty for old dreams)
        const symPrimary = dream.symbols_primary || [];
        const symSecondary = dream.symbols_secondary || [];
        const symNoise = dream.symbols_noise || [];

        // fallback for old dreams with only "symbols"
        const hasFallbackOld = dream.symbols?.length > 0;

        const hasAnySymbol =
          symPrimary.length > 0 ||
          symSecondary.length > 0 ||
          symNoise.length > 0 ||
          hasFallbackOld;

        return (
          <div key={id} className="dream-card">

            {/* HEADER */}
            <div className="dream-card-header">
              <strong>{dream.title || "Untitled Dream"}</strong>
              <span className="dream-date">{dream.date}</span>
              <button className="delete-button" onClick={() => onDelete(id)}>
                Delete
              </button>
            </div>

            {/* SUMMARY */}
            {dream.summary && (
              <p className="dream-summary">
                <strong>🪶 Summary:</strong> {dream.summary}
              </p>
            )}

            {/* EMOTION */}
            {dream.emotions?.dominant && (
              <p><strong>Dominant Emotion:</strong> {cap(dream.emotions.dominant)}</p>
            )}

            {/* ARCHETYPE */}
            {dream.archetype && (
              <p><strong>Archetype:</strong> {cap(dream.archetype)}</p>
            )}

            {/* THEMES */}
            {themesStr && (
              <p className="dream-themes">
                <strong>Themes:</strong> {themesStr}
              </p>
            )}

            {/* RECURRING SYMBOLS */}
            {dream.recurring_symbols?.length > 0 && (
              <p className="dream-recurring">
                🔁 <strong>Recurring Symbols:</strong>{" "}
                {dream.recurring_symbols.join(", ")}
              </p>
            )}

            {/* CONTENT */}
            {dream.content && (
              <p className="dream-content">
                <strong>Full Dream:</strong> {dream.content}
              </p>
            )}

            {/* SYMBOLS – PRIMARY / SECONDARY / NOISE */}
            {hasAnySymbol && (
              <div className="section">

                {/* Toggle */}
                <button
                  className="toggle-insights-button"
                  onClick={() => toggle(id, "symbols")}
                >
                  {open[`${id}-symbols`] ? "Hide Symbols" : "Show Symbols"}
                </button>

                {/* Sorting */}
                {open[`${id}-symbols`] && (
                  <div className="symbol-sort-toggle">
                    <span>Sort:</span>
                    <button
                      className={symbolSortMode === "weight" ? "sort-active" : ""}
                      onClick={() => setSymbolSortMode("weight")}
                    >
                      Weight
                    </button>
                    <button
                      className={symbolSortMode === "alpha" ? "sort-active" : ""}
                      onClick={() => setSymbolSortMode("alpha")}
                    >
                      A–Z
                    </button>
                  </div>
                )}

                {open[`${id}-symbols`] && (
                  <div className="symbols-wrapper">

                    {/* PRIMARY */}
                    {symPrimary.length > 0 && (
                      <>
                        <h4 className="symbol-section-title">Primary Symbols</h4>
                        <div className="symbols-grid">
                          {sortSymbols(symPrimary).map((s, i) => (
                            <div key={i} className="symbol-box">
                              <div className="symbol-title">{cap(s.symbol)}</div>
                              {s.meaning && (
                                <div className="symbol-meaning">{s.meaning}</div>
                              )}
                              <div className="symbol-score">Score: {s.weight}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* SECONDARY */}
                    {symSecondary.length > 0 && (
                      <div className="symbol-section">
                        <button
                          className="symbol-sub-toggle"
                          onClick={() => toggle(id, "secondary")}
                        >
                          {open[`${id}-secondary`] ? "Hide Secondary" : "Show Secondary"}
                        </button>

                        {open[`${id}-secondary`] && (
                          <div className="symbols-grid">
                            {sortSymbols(symSecondary).map((s, i) => (
                              <div key={i} className="symbol-box">
                                <div className="symbol-title">{cap(s.symbol)}</div>
                                <div className="symbol-meaning">{s.meaning}</div>
                                <div className="symbol-score">Score: {s.weight}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* NOISE */}
                    {symNoise.length > 0 && (
                      <div className="symbol-section">
                        <button
                          className="symbol-sub-toggle"
                          onClick={() => toggle(id, "noise")}
                        >
                          {open[`${id}-noise`] ? "Hide Noise" : "Show Noise"}
                        </button>

                        {open[`${id}-noise`] && (
                          <div className="symbols-grid">
                            {sortSymbols(symNoise).map((s, i) => (
                              <div key={i} className="symbol-box">
                                <div className="symbol-title">{cap(s.symbol)}</div>
                                <div className="symbol-meaning">{s.meaning}</div>
                                <div className="symbol-score">Score: {s.weight}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* OLD DREAMS FALLBACK */}
                    {hasFallbackOld && !symPrimary.length && (
                      <>
                        <h4 className="symbol-section-title">Symbols</h4>
                        <div className="symbols-grid">
                          {sortSymbols(dream.symbols).map((s, i) => (
                            <div key={i} className="symbol-box">
                              <div className="symbol-title">{cap(s.symbol)}</div>
                              {s.meaning && (
                                <div className="symbol-meaning">{s.meaning}</div>
                              )}
                              <div className="symbol-score">
                                Score: {s.weight || s.semantic_score || ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* COMBINED INSIGHTS */}
            {dream.combined_insights?.length > 0 && (
              <div className="section">
                <button
                  className="toggle-insights-button"
                  onClick={() => toggle(id, "insight")}
                >
                  {open[`${id}-insight`] ? "Hide Interpretation" : "Show Interpretation"}
                </button>

                {open[`${id}-insight`] && (
                  <div className="insights-content">
                    <p>{dream.combined_insights[0].insight}</p>
                  </div>
                )}
              </div>
            )}

            {/* EVENTS */}
            {dream.events && (
              <p><strong>Events:</strong> {renderList(dream.events)}</p>
            )}

            {/* ENTITIES */}
            {entitiesStr && <p><strong>Entities:</strong> {entitiesStr}</p>}

            {/* CHARACTERS */}
            {peopleStr && <p><strong>Characters:</strong> {peopleStr}</p>}

            {/* LOCATIONS */}
            {locationsStr && <p><strong>Locations:</strong> {locationsStr}</p>}

            {/* OBJECTS */}
            {objectsStr && <p><strong>Objects:</strong> {objectsStr}</p>}

            {/* CAUSE–EFFECT */}
            {causeEffectStr && (
              <p><strong>Cause–Effect:</strong> {causeEffectStr}</p>
            )}

            {/* CONFLICTS */}
            {conflictsStr && (
              <p><strong>Conflicts:</strong> {conflictsStr}</p>
            )}

            {/* DESIRES */}
            {desiresStr && (
              <p><strong>Desires:</strong> {desiresStr}</p>
            )}

            {/* NARRATIVE */}
            {narrative && (
              <div className="section">
                <button
                  className="toggle-insights-button"
                  onClick={() => toggle(id, "narrative")}
                >
                  {open[`${id}-narrative`]
                    ? "Hide Narrative Structure"
                    : "Show Narrative Structure"}
                </button>

                {open[`${id}-narrative`] && (
                  <div className="insights-content">
                    <ul>
                      <li><strong>Setup:</strong> {narrative.setup}</li>
                      <li><strong>Climax:</strong> {narrative.climax}</li>
                      <li><strong>Resolution:</strong> {narrative.resolution}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
