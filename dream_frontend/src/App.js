import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import DreamForm from "./components/Dream_analyzer/DreamForm";
import DreamList from "./components/Dream_analyzer/DreamList";

import LandingPage from "./components/Landing/LandingPage";
import Login from "./components/Login_and_registration/login";
import Signup from "./components/Login_and_registration/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Common/Navbar/Navbar";
import Home from "./components/Home/HomePage";   // ← Make sure file name matches

import { authHeaders, logout } from "./auth";
import "./App.css";

function App() {
  const [dreams, setDreams] = useState([]);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const SHOW_LANDING = true;

  // Hide navbar only on these pages
  const hideNavbarRoutes = ["/welcome", "/login", "/signup"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

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

  // Fetch dreams except on login/signup
  useEffect(() => {
    const token = localStorage.getItem("token");

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
    <div className="app-wrapper page-wrapper">

      {!shouldHideNavbar && <Navbar />}

      <Routes>

        {/* LANDING PAGE */}
        <Route path="/welcome" element={<LandingPage />} />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login onLogin={() => navigate("/home")} />}
        />

        {/* SIGNUP */}
        <Route path="/signup" element={<Signup />} />

        {/* HOME DASHBOARD */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            SHOW_LANDING
              ? <Navigate to="/welcome" />
              : <Navigate to="/dream-analyzer" />
          }
        />

        {/* DREAM ANALYZER */}
        <Route
          path="/dream-analyzer"
          element={
            <ProtectedRoute>
              <div className="dream-journal-page">
                
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
