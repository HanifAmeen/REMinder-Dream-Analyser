import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import DreamAnalyzer from "./components/Dream_analyzer/DreamAnalyzer";
import LandingPage from "./components/Landing/LandingPage";
import Login from "./components/Login_and_registration/login";
import Signup from "./components/Login_and_registration/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Common/Navbar/Navbar";
import Home from "./components/Home/HomePage";

import { authHeaders, logout } from "./auth";
import "./App.css";

function App() {
  const [dreams, setDreams] = useState([]);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const SHOW_LANDING = true;

  // Pages that must NOT have Navbar or the App wrapper
  const standalonePages = ["/welcome", "/login", "/signup"];
  const isStandalone = standalonePages.includes(location.pathname);

  // Fetch dreams
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

  // Fetch dreams except on login/signup/welcome
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (isStandalone) return;
    fetchDreams();
  }, [location.pathname]);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  return (
    <>
      {/* Standalone Public Pages (NO APP WRAPPER) */}
      {isStandalone ? (
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/login" element={<Login onLogin={() => navigate("/home")} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/welcome" />} />
        </Routes>
      ) : (
        /* Authenticated Pages Use App Wrapper */
        <div className="page-wrapper">
          <Navbar />

          <Routes>
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dream-analyzer"
              element={
                <ProtectedRoute>
                  <DreamAnalyzer
                    dreams={dreams}
                    onAdd={addDream}
                    onDelete={deleteDream}
                    listRef={listRef}
                  />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/welcome" />} />
          </Routes>
        </div>
      )}
    </>
  );
}

export default App;
