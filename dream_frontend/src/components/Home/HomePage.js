import React, { useEffect, useState } from "react";
import "./home.css";
import ActionCard from "../Common/ActionCard/ActionCard";

export default function Home() {
  const user = JSON.parse(localStorage.getItem("user"));
  const justLoggedIn = localStorage.getItem("justLoggedIn") === "true";

  const [title, setTitle] = useState(justLoggedIn
    ? `Welcome Back ${user?.username}`
    : "REMinder"
  );

  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!justLoggedIn) return; // If not fresh login → skip animation

    const timer = setTimeout(() => {
      setFade(false);

      setTimeout(() => {
        setTitle("REMinder");
        setFade(true);

        // Prevent animation on future visits
        localStorage.setItem("justLoggedIn", "false");
      }, 500);
    }, 10000);

    return () => clearTimeout(timer);
  }, [justLoggedIn]);


  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className={fade ? "fade-in" : "fade-out"}>{title}</h1>
        <p>Your dream world is waiting.</p>
      </div>

      <div className="home-grid">
        <ActionCard title="Add a Dream" subtitle="Record a new dream entry" to="/add-dream" icon="✏️" />
        <ActionCard title="My Dreams" subtitle="View your full dream journal" to="/dreams" icon="📘" />
        <ActionCard title="Dream Analyzer" subtitle="Analyze dreams with AI" to="/dream-analyzer" icon="🧠" />
        <ActionCard title="Symbols" subtitle="Explore dream symbols" to="/symbols" icon="🔮" />
        <ActionCard title="Insights" subtitle="View your patterns" to="/insights" icon="📊" />
        <ActionCard title="Profile" subtitle="Adjust your settings" to="/profile" icon="⚙️" />
      </div>
    </div>
  );
}
