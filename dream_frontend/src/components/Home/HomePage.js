import React from "react";
import "./home.css";
import ActionCard from "../Common/ActionCard/ActionCard";

export default function Home() {

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Welcome Back</h1>
        <p>Your dream world is waiting.</p>
      </div>

      <div className="home-grid">
        <ActionCard 
          title="Add a Dream"
          subtitle="Record a new dream entry"
          to="/add-dream"
          icon="✏️"
        />

        <ActionCard 
          title="My Dreams"
          subtitle="View your full dream journal"
          to="/dreams"
          icon="📘"
        />

        <ActionCard 
          title="Dream Analyzer"
          subtitle="Analyze dreams with AI"
          to="/dream-analyzer"
          icon="🧠"
        />

        <ActionCard 
          title="Symbols"
          subtitle="Explore dream symbols"
          to="/symbols"
          icon="🔮"
        />

        <ActionCard 
          title="Insights"
          subtitle="View your patterns"
          to="/insights"
          icon="📊"
        />

        <ActionCard 
          title="Profile"
          subtitle="Adjust your settings"
          to="/profile"
          icon="⚙️"
        />
      </div>
    </div>
  );
}
