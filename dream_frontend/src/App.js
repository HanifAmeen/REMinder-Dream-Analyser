import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import DreamForm from "./components/Dream_analyzer/DreamForm";
import DreamList from "./components/Dream_analyzer/DreamList";

import Login from "./components/Login_and_registration/login";
import Signup from "./components/Login_and_registration/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

import { authHeaders, logout } from "./auth";
import "./App.css";

function App() {
  const [dreams, setDreams] = useState([]);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ───────────────────────────────
  // FETCH DREAMS
  // ───────────────────────────────
  const fetchDreams = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_dreams", {
        method: "GET",
        headers: authHeaders(),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        console.error("Backend error:", await res.text());
        return;
      }

      const data = await res.json();
      setDreams(data);
    } catch (err) {
      console.error("Error fetching dreams:", err);
    }
  };

  // ───────────────────────────────
  // ADD DREAM
  // ───────────────────────────────
  const addDream = async ({ title, content, mood }) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/add_dream", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title, content, mood }),
      });

      if (res.status === 401) {
        logout();
        throw new Error("Unauthorized");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save dream");
      }

      await fetchDreams();
      scrollToBottom();
      return data;

    } catch (err) {
      console.error("Error adding dream:", err);
      throw err;
    }
  };

  // ───────────────────────────────
  // DELETE DREAM
  // ───────────────────────────────
  const deleteDream = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/delete_dream/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      await fetchDreams();
    } catch (err) {
      console.error("Error deleting dream:", err);
    }
  };

  // ───────────────────────────────
  // FIXED USEEFFECT — NO MORE LOOP
  // ───────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Do NOT fetch dreams if:
    // - Not logged in
    // - On login page
    // - On signup page
    if (!token) return;
    if (location.pathname === "/login" || location.pathname === "/signup") return;

    fetchDreams();
  }, [location.pathname]);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  return (
    <div className="app-wrapper">

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login onLogin={() => navigate("/")} />}
        />

        {/* SIGNUP */}
        <Route path="/signup" element={<Signup />} />

        {/* PROTECTED DREAM PAGE */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="dream-journal-page">

                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>

                <h1 className="dream-page-title">AI Dream Analyzer</h1>

                <div className="dream-dashboard">

                  <div className="dream-form-wrapper">
                    <DreamForm onAdd={addDream} />
                  </div>

                  <div className="dream-list-wrapper" ref={listRef}>
                    <DreamList dreams={dreams} onDelete={deleteDream} />
                  </div>

                </div>
              </div>
            </ProtectedRoute>
          }
        />

      </Routes>

    </div>
  );
}

export default App;
