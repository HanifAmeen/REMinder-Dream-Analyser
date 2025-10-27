import React, { useEffect, useState, useRef } from "react";
import DreamForm from "./components/DreamForm";
import DreamList from "./components/DreamList";
import "./App.css";

function App() {
  const [dreams, setDreams] = useState([]);
  const listRef = useRef(null);

  // Fetch dreams from Flask
  const fetchDreams = async () => {
    const res = await fetch("http://localhost:5000/get_dreams");
    const data = await res.json();
    setDreams(data);
  };

  // Add dream
  const addDream = async (dream) => {
    const res = await fetch("http://localhost:5000/add_dream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dream),
    });
    if (res.ok) {
      await fetchDreams();
      scrollToBottom();
    }
  };

  // Delete dream
  const deleteDream = async (id) => {
    await fetch(`http://localhost:5000/delete_dream/${id}`, { method: "DELETE" });
    await fetchDreams();
  };

  useEffect(() => {
    fetchDreams();
  }, []);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  return (
    <div className="dream-journal-page">
      <h1 className="dream-page-title">AI Dream Journal</h1>
      <div className="dream-dashboard">
        <div className="dream-form-wrapper">
          <DreamForm onAdd={addDream} />
        </div>
        <div className="dream-list-wrapper" ref={listRef}>
          <DreamList dreams={dreams} onDelete={deleteDream} />
        </div>
      </div>
    </div>
  );
}

export default App;
