import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submitSignup = async (e) => {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed");
      return;
    }

    alert("Account created! You can now log in.");
    window.location.href = "/login";
  };

  return (
    <div className="auth-container">
      <h2>Signup</h2>

      <form onSubmit={submitSignup} className="auth-form">
        <p>Email</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
         <p>Username</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
         <p>Password</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Signup</button>
      </form>

      <a href="/login" className="switch-auth-text">
        Already have an account? Sign in
      </a>
    </div>
  );
}

export default Signup;
