// DreamList.js (v5 fully updated)
import React, { useState } from "react";
import "./DreamList.css";

/* --------------------------------------------------------
   HELPERS
---------------------------------------------------------*/

// Cause–effect formatter
const formatCauseEffect = (ce) => {
  if (!ce) return "";
  if (Array.isArray(ce)) {
    return ce
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;

        if (typeof item === "object") {
          const left = item.left || item.cause || "";
          const right = item.right || item.effect || "";
          const trigger = item.trigger_phrase ? ` (${item.trigger_phrase})` : "";

          if (left && right) return `${left} → ${right}${trigger}`;
          if (left && !right) return `${left}${trigger}`;
          if (!left && right) return `${right}${trigger}`;
          if (item.sentence) return item.sentence;

          return JSON.stringify(item);
        }

        return String(item);
      })
      .filter(Boolean)
      .join("; ");
  }

  if (typeof ce === "object") {
    const left = ce.left || ce.cause || "";
    const right = ce.right || ce.effect || "";
    if (left || right) return `${left} → ${right}`;
    return ce.sentence || JSON.stringify(ce);
  }

  return String(ce);
};

// Generic list renderer
const renderList = (v) => {
  if (!v) return null;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "string") return v;
  return JSON.stringify(v ?? "");
};

// Entity renderer
const renderEntities = (entities) => {
  if (!entities) return "";
  if (!Array.isArray(entities)) return String(entities);

  return entities
    .map((e) =>
      typeof e === "string"
        ? e
        : e?.text || e?.name || JSON.stringify(e)
    )
    .filter(Boolean)
    .join(", ");
};

// Capitalize
const cap = (s) =>
  typeof s === "string" && s.length > 0
    ? s.charAt(0).toUpperCase() + s.slice(1)
    : s;

// Symbol sorting
const sortSymbols = (arr = [], mode = "weight") => {
  if (!Array.isArray(arr)) return [];
  const copy = [...arr];

  if (mode === "alpha") {
    return copy.sort((a, b) =>
      String(a.symbol || "").localeCompare(String(b.symbol || ""))
    );
  }

  // weight sort fallback
  return copy.sort((a, b) => {
    const wa = Number(a.weight ?? a.semantic_score ?? a.score ?? 0);
    const wb = Number(b.weight ?? b.semantic_score ?? b.score ?? 0);
    return wb - wa;
  });
};

/* --------------------------------------------------------
   EMOTIONAL ARC SPARKLINE (no hooks)
---------------------------------------------------------*/

// emotion scale → numeric
const emoToNum = (label) => {
  if (!label) return 0.5;
  const l = label.toLowerCase();
  if (["fear", "sadness", "anger", "disgust"].includes(l)) return 0.1;
  if (["neutral"].includes(l)) return 0.5;
  if (["surprise", "joy", "happy", "love"].includes(l)) return 0.95;
  return 0.6;
};

const buildSparkline = (arc = [], width = 240, height = 48, padding = 6) => {
  try {
    if (!Array.isArray(arc) || arc.length === 0) {
      const y = height / 2;
      return {
        svg: (
          <svg width={width} height={height}>
            <line x1="0" y1={y} x2={width} y2={y} stroke="#8e24aa" />
          </svg>
        ),
      };
    }

    const n = arc.length;
    const stepX = (width - padding * 2) / Math.max(1, n - 1);
    const pts = arc.map((a, i) => {
      const val = emoToNum(a.dominant);
      const x = padding + i * stepX;
      const y = padding + (1 - val) * (height - padding * 2);
      return [x, y];
    });

    const pathD = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
      .join(" ");

    const fillD =
      pathD +
      ` L ${pts[pts.length - 1][0]} ${height - padding} L ${pts[0][0]} ${
        height - padding
      } Z`;
      

    return {
      svg: (
        <svg width={width} height={height}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8e24aa" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8e24aa" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          <path d={fillD} fill="url(#sparkGrad)" />
          <path
            d={pathD}
            fill="none"
            stroke="#b0b0ff"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2} fill="#b0b0ff" />
          ))}
        </svg>
      ),
    };
  } catch {
    return {
      svg: (
        <svg width={width} height={height}>
          <line x1="0" y1={24} x2={width} y2={24} stroke="#8e24aa" />
        </svg>
      ),
    };
  }
};

// Format date
const formatDate = (d) => {
  if (!d) return "";
  if (typeof d === "string") return d;
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
};

/* --------------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------------*/

export default function DreamList({ dreams = [], onDelete = () => {} }) {
  const [open, setOpen] = useState({});
  const [sortModes, setSortModes] = useState({}); // per-dream

  const toggle = (id, key) => {
    const k = `${id}-${key}`;
    setOpen((p) => ({ ...p, [k]: !p[k] }));
  };

  const setSort = (id, mode) => {
    setSortModes((p) => ({ ...p, [id]: mode }));
  };

  return (
    <div className="dream-list-container">
      <h2 className="dream-list-title">Dream Archive</h2>

      {dreams.length === 0 && (
        <p className="no-dreams">No dreams recorded yet.</p>
      )}


      {dreams.map((dream) => {
        console.log("FULL DREAM OBJECT:", dream); // ✅ VALID LOCATION
        const id = dream.id;
        const summary = dream.summary || "";
        const mood =
          dream.mood || dream.emotions?.dominant || "Neutral";
        const archetype = dream.archetype || null;
        const themes = Array.isArray(dream.themes)
          ? dream.themes
          : typeof dream.themes === "string"
          ? dream.themes.split(",").map((s) => s.trim())
          : [];

        const recurring = dream.recurring_symbols || [];
        const content = dream.content || "";

        const primary = dream.symbols_primary || [];
        const secondary = dream.symbols_secondary || [];
        const noise = dream.symbols_noise || [];

        const fallbackSymbols =
          !primary.length && !secondary.length && !noise.length
            ? dream.symbols || []
            : [];

        const events = dream.events || [];
        const entities = dream.entities || [];
        const people = dream.people || [];
        const locations = dream.locations || [];
        const objects = dream.objects || [];
        const cause_effect = dream.cause_effect || [];
        const conflicts = dream.conflicts || [];
        const desires = dream.desires || [];

        const narrative =
          typeof dream.narrative === "object" ? dream.narrative : null;

        const emotionalArc =
          dream.emotional_arc?.arc || dream.emotional_arc || [];
        const spark = buildSparkline(emotionalArc, 260, 56);

        const sortMode = sortModes[id] || "weight";

        /* -------- PRIMARY SYMBOL PREVIEW -------- */
        const topPreview = primary
          .slice()
          .sort((a, b) => (b.weight || 0) - (a.weight || 0))
          .slice(0, 3)
          .map((s) => s.symbol)
          .join(", ");

        return (
          <div key={id} className="dream-card">
            {/* HEADER */}
            <div className="dream-card-header">
              <div>
                <strong>{dream.title || "Untitled Dream"}</strong>
                <div className="dream-date">{formatDate(dream.date)}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{cap(mood)}</div>
                {archetype && (
                  <div style={{ fontSize: 12, color: "#a8a8ff" }}>
                    {cap(archetype)}
                  </div>
                )}
                <button
                  className="delete-button"
                  onClick={() => onDelete(id)}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* SUMMARY */}
            {summary && (
              <p className="dream-summary">
                <strong>🪶 Summary:</strong> {summary}
              </p>
            )}

            {/* SPARKLINE + THEMES/RECURRING */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 260 }}>{spark.svg}</div>

              <div style={{ flex: 1 }}>
                {recurring.length > 0 && (
                  <div className="dream-motifs">
                    🔁 <strong>Recurring:</strong> {recurring.join(", ")}
                  </div>
                )}
                {themes.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#a8a8ff",
                      fontStyle: "italic",
                    }}
                  >
                    <strong>Themes:</strong> {themes.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* FULL DREAM */}
            {content && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", color: "#cfcfff" }}>
                  Full Dream (click to expand)
                </summary>
                <p className="dream-content">{content}</p>
              </details>
            )}

            {/* TOP 3 SYMBOL PREVIEW */}
            {topPreview && (
              <div
                style={{
                  marginTop: 12,
                  color: "#d0d0ff",
                  opacity: 0.9,
                  fontSize: 14,
                }}
              >
                <strong>Key Symbols:</strong> {topPreview}
              </div>
            )}

            {/* SYMBOLS COLLAPSIBLE */}
            {(primary.length ||
              secondary.length ||
              noise.length ||
              fallbackSymbols.length) && (
              <div className="section" style={{ marginTop: 12 }}>
                <button
                  className="toggle-insights-button"
                  onClick={() => toggle(id, "symbols")}
                >
                  {open[`${id}-symbols`] ? "Hide Symbols" : "Show Symbols"}
                </button>

                {open[`${id}-symbols`] && (
                  <>
                    {/* SORTING */}
                    <div className="symbol-sort-toggle" style={{ marginTop: 8 }}>
                      <span>Sort:</span>
                      <button
                        className={sortMode === "weight" ? "sort-active" : ""}
                        onClick={() => setSort(id, "weight")}
                      >
                        Weight
                      </button>
                      <button
                        className={sortMode === "alpha" ? "sort-active" : ""}
                        onClick={() => setSort(id, "alpha")}
                      >
                        A–Z
                      </button>
                    </div>

                    <div className="symbols-wrapper">
                      {/* PRIMARY */}
                      {primary.length > 0 && (
                        <>
                          <h4 className="symbol-section-title">
                            Primary Symbols
                          </h4>
                          <div className="symbols-grid">
                            {sortSymbols(primary, sortMode).map((s, i) => (
                              <div key={i} className="symbol-box">
                                <div className="symbol-title">
                                  {cap(s.symbol)}
                                </div>
                                {s.meaning && (
                                  <div className="symbol-meaning">
                                    {s.meaning}
                                  </div>
                                )}
                                <div className="symbol-score">
                                  Score:{" "}
                                  {Number(
                                    s.weight ??
                                      s.semantic_score ??
                                      0
                                  ).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* SECONDARY */}
                      {secondary.length > 0 && (
                        <div className="symbol-section">
                          <button
                            className="symbol-sub-toggle"
                            onClick={() => toggle(id, "secondary")}
                          >
                            {open[`${id}-secondary`]
                              ? "Hide Secondary"
                              : "Show Secondary"}
                          </button>

                          {open[`${id}-secondary`] && (
                            <div className="symbols-grid">
                              {sortSymbols(secondary, sortMode).map((s, i) => (
                                <div key={i} className="symbol-box">
                                  <div className="symbol-title">
                                    {cap(s.symbol)}
                                  </div>
                                  <div className="symbol-meaning">
                                    {s.meaning}
                                  </div>
                                  <div className="symbol-score">
                                    Score:{" "}
                                    {Number(
                                      s.weight ??
                                        s.semantic_score ??
                                        0
                                    ).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* NOISE */}
                      {noise.length > 0 && (
                        <div className="symbol-section">
                          <button
                            className="symbol-sub-toggle"
                            onClick={() => toggle(id, "noise")}
                          >
                            {open[`${id}-noise`]
                              ? "Hide Noise"
                              : "Show Noise"}
                          </button>

                          {open[`${id}-noise`] && (
                            <div className="symbols-grid">
                              {sortSymbols(noise, sortMode).map((s, i) => (
                                <div key={i} className="symbol-box">
                                  <div className="symbol-title">
                                    {cap(s.symbol)}
                                  </div>
                                  <div className="symbol-meaning">
                                    {s.meaning}
                                  </div>
                                  <div className="symbol-score">
                                    Score:{" "}
                                    {Number(
                                      s.weight ??
                                        s.semantic_score ??
                                        0
                                    ).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* OLD DREAMS */}
                      {fallbackSymbols.length > 0 && (
                        <>
                          <h4 className="symbol-section-title">Symbols</h4>
                          <div className="symbols-grid">
                            {sortSymbols(fallbackSymbols, sortMode).map(
                              (s, i) => (
                                <div key={i} className="symbol-box">
                                  <div className="symbol-title">
                                    {cap(s.symbol || s.word)}
                                  </div>
                                  <div className="symbol-meaning">
                                    {s.meaning || s.interp_first || ""}
                                  </div>
                                  <div className="symbol-score">
                                    Score:{" "}
                                    {Number(
                                      s.weight ??
                                        s.semantic_score ??
                                        0
                                    ).toFixed(2)}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* INTERPRETATION */}
            {dream.combined_insights?.length > 0 && (
              <div className="section" style={{ marginTop: 12 }}>
                <button
                  className="toggle-insights-button"
                  onClick={() => toggle(id, "insight")}
                >
                  {open[`${id}-insight`]
                    ? "Hide Interpretation"
                    : "Show Interpretation"}
                </button>

                {open[`${id}-insight`] && (
                  <div className="insights-content">
                    <p>{dream.combined_insights[0].insight}</p>
                    {dream.analysis_version && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9f9fff",
                          marginTop: 8,
                        }}
                      >
                        Analysis: {dream.analysis_version}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

{/* PSYCHOLOGICAL INTERPRETATION */}
{dream.psychological_interpretation &&
 dream.psychological_interpretation.sections && (
  <div className="section" style={{ marginTop: 12 }}>
    <button
      className="toggle-insights-button"
      onClick={() => toggle(id, "psych")}
    >
      {open[`${id}-psych`] 
        ? "Hide Psychological Interpretation"
        : "Show Psychological Interpretation"}
    </button>

    {open[`${id}-psych`] && (
      <div className="psych-container">

        {/* OVERALL */}
        {dream.psychological_interpretation.overall && (
          <div className="psych-overall">
            {dream.psychological_interpretation.overall}
          </div>
        )}

        {/* SECTIONS */}
        {dream.psychological_interpretation.sections.map((sec, i) => (
          <div key={i} className="psych-section">
            <div className="psych-section-title">{sec.title}</div>
            <div className="psych-section-body">{sec.text}</div>
          </div>
        ))}

        {/* SHORT SUMMARY */}
        {dream.psychological_interpretation.summary && (
          <div className="psych-summary">
            <strong>Summary:</strong>{" "}
            {dream.psychological_interpretation.summary}
          </div>
        )}
      </div>
    )}
  </div>
)}

            {/* STRUCTURED FIELDS */}
            <div style={{ marginTop: 12 }}>
              {events.length > 0 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#b0b0ff",
                      marginBottom: 6,
                    }}
                  >
                    Events
                  </div>
                  {events.slice(0, 6).map((ev, i) => (
                    <div
                      key={i}
                      className="dream-symbols-box"
                      style={{ marginBottom: 8 }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {ev.action || ev.verb || "action"}
                      </div>
                      <div style={{ fontSize: 13 }}>
                        {ev.sentence ||
                          `${ev.actor || ""} → ${ev.object || ""}`}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {entities.length > 0 && (
                <p>
                  <strong>Entities:</strong> {renderEntities(entities)}
                </p>
              )}

              {people.length > 0 && (
                <p>
                  <strong>Characters:</strong> {renderList(people)}
                </p>
              )}

              {locations.length > 0 && (
                <p>
                  <strong>Locations:</strong> {renderList(locations)}
                </p>
              )}

              {objects.length > 0 && (
                <p>
                  <strong>Objects:</strong> {renderList(objects)}
                </p>
              )}

              {cause_effect.length > 0 && (
                <p>
                  <strong>Cause–Effect:</strong>{" "}
                  {formatCauseEffect(cause_effect)}
                </p>
              )}

              {conflicts.length > 0 && (
                <p>
                  <strong>Conflicts:</strong> {renderList(conflicts)}
                </p>
              )}

              {desires.length > 0 && (
                <p>
                  <strong>Desires:</strong> {renderList(desires)}
                </p>
              )}
            </div>

            {/* NARRATIVE */}
            {narrative && (
              <div className="section" style={{ marginTop: 12 }}>
                <button
                  className="toggle-insights-button"
                  onClick={() => toggle(id, "narrative")}
                >
                  {open[`${id}-narrative`]
                    ? "Hide Narrative"
                    : "Show Narrative"}
                </button>

                {open[`${id}-narrative`] && (
                  <div className="insights-content">
                    <ul style={{ paddingLeft: 18 }}>
                      <li>
                        <strong>Setup:</strong>{" "}
                        {narrative.setup || "—"}
                      </li>
                      <li>
                        <strong>Climax:</strong>{" "}
                        {narrative.climax || "—"}
                      </li>
                      <li>
                        <strong>Resolution:</strong>{" "}
                        {narrative.resolution || "—"}
                      </li>
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
