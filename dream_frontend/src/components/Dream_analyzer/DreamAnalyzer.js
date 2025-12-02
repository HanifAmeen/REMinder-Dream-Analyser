import React, { useState, useEffect } from "react";
import DreamForm from "./DreamForm";
import DreamList from "./DreamList";
import "./DreamPage.css";

export default function DreamAnalyzer() {
  const [dreams, setDreams] = useState([]);

  // ==========================
  // FETCH DREAMS ON LOAD
  // ==========================
  const fetchDreams = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://127.0.0.1:5000/get_dreams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      // Backend returns ARRAY directly
      setDreams(data || []);
    } catch (error) {
      console.error("Error fetching dreams:", error);
    }
  };

  useEffect(() => {
    fetchDreams();
  }, []);

  // ==========================
  // ADD DREAM
  // ==========================
  const handleAddDream = async (dreamData) => {
    const token = localStorage.getItem("token");

    const response = await fetch("http://127.0.0.1:5000/add_dream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dreamData),
    });

    if (!response.ok) {
      throw new Error("Failed to save dream");
    }

    await fetchDreams();
  };

  // ==========================
  // DELETE DREAM
  // ==========================
  const handleDeleteDream = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://127.0.0.1:5000/delete_dream/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setDreams((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="dream-journal-page">
      <h1 className="dream-page-title">AI Dream Analyzer</h1>

      <div className="dream-dashboard">

        <div className="dream-form-wrapper">
          <DreamForm onAdd={handleAddDream} />
        </div>

        <div className="dream-list-wrapper">
          <DreamList dreams={dreams} onDelete={handleDeleteDream} />
        </div>

      </div>
    </div>
  );
}
