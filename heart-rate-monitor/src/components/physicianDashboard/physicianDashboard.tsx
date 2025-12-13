import React, { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const PhysicianDashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "physician") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <main className="page-container">
      <div className="simple-grid">
        <div className="card">
          <div className="section-header">
            <h2 style={{ margin: 0 }}>Physician Dashboard</h2>
            <p className="muted" style={{ margin: 0 }}>
              Backend: {API_BASE}
            </p>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Manage assigned patients, view summaries, daily details, and override measurement frequency.
          </p>
          <nav className="inline-actions" style={{ marginTop: 10 }}>
            <Link className="outline-button" to="patients">
              View all patients
            </Link>
          </nav>
        </div>
        <div className="card">
          <h3>Workflow</h3>
          <ul className="feature-list">
            <li>Patients: list assigned patients with device counts.</li>
            <li>Summary: latest readings per device, frequency override controls.</li>
            <li>Daily: pick a date to see time-stamped readings.</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Outlet />
      </div>
    </main>
  );
};

export default PhysicianDashboard;
