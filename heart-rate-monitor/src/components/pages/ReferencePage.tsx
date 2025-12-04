import React from "react";
import "./Pages.css";

const REFERENCE_ITEMS = [
  { title: "Backend APIs", detail: "List REST endpoints (e.g., /api/auth, /api/device, /api/measurements)." },
  { title: "Libraries", detail: "@mui/material, React Router, bcrypt, mongoose, express, jwt-simple." },
  { title: "Hardware", detail: "Photon 2 device connection details and any firmware references." },
  { title: "Docs & Links", detail: "Add URLs for API docs, design docs, and testing notes." },
];

export function ReferencePage() {
  return (
    <main className="page-container">
      <h1 className="page-title">References</h1>
      <p className="muted">
        Placeholder page for APIs, libraries, and documentation. Replace the bullets below with your actual notes.
      </p>

      <div className="simple-grid">
        {REFERENCE_ITEMS.map((item) => (
          <div className="card" key={item.title}>
            <h2>{item.title}</h2>
            <p className="muted">{item.detail}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

export default ReferencePage;
