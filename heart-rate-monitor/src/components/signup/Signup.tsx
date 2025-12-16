import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../pages/Pages.css";

const API_BASE = "https://sfwe513.publicvm.com";

function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(pw);
}

const Signup: React.FC = function () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "physician">("user");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async function (e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!isStrongPassword(password)) {
      setMessage("Password must be at least 8 chars with upper, lower, number, and special character.");
      return;
    }

    const endpoint =
      role === "physician"
        ? `${API_BASE}/api/auth/physician/signup`
        : `${API_BASE}/api/auth/signup`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.user && data.user.id) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("role", data.user.role || "user");
      }

      if (data.user.role === "physician") {
        navigate("/physician-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setMessage("Network error: " + err.message);
    }
  };

  return (
    <main className="page-container auth-page">
      <div className="card form-card">
        <h2>Sign up</h2>
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

          <div className="radio-row">
            <label>
              <input
                type="radio"
                value="user"
                checked={role === "user"}
                onChange={() => setRole("user")}
              />
              Regular user
            </label>
            <label>
              <input
                type="radio"
                value="physician"
                checked={role === "physician"}
                onChange={() => setRole("physician")}
              />
              Physician
            </label>
          </div>

          <button className="primary-btn" type="submit">
            Sign up
          </button>
          {message && <p className="error-text">{message}</p>}
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
