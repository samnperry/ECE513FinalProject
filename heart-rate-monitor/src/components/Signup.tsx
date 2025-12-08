import { set } from "mongoose";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./pages/Pages.css";

const Signup: React.FC = function() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async function(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Signup failed");
      } 

      localStorage.setItem("token", data.token);
      setMessage(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <main className="page-container auth-page">
      <div className="card form-card">
        <h2>Sign Up</h2>
        <form className="form-actions" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="full-width"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="full-width"
          />
          <button className="primary-btn" type="submit">Sign Up</button>
          {message && <p className="error-text">{message}</p>}
        </form>
        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Log in here</Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
