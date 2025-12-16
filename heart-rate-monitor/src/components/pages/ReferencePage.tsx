import React from "react";
import "./Pages.css";

const REFERENCE_SECTIONS = [
  {
    title: "Third-party APIs / Services",
    items: [
      "Particle Cloud Webhooks: ingest measurements (Photon2_SendEvent) and serve config (Photon2_Config_Request).",
      "MongoDB Atlas: managed database for users, devices, measurements.",
      "Let’s Encrypt + Certbot: TLS certificates for sfwe513.publicvm.com.",
      "Nginx: reverse proxy and static asset hosting on EC2."
    ]
  },
  {
    title: "Backend Libraries",
    items: [
      "Express 5, cors, express.json for REST API routing.",
      "mongoose for MongoDB models (User, Device, Measurement).",
      "bcrypt for password hashing; jwt-simple for JWT auth.",
      "Node.js runtime managed by pm2 on EC2."
    ]
  },
  {
    title: "Frontend Libraries",
    items: [
      "React + TypeScript (CRA), react-router-dom for routing.",
      "Chart.js for weekly/daily heart rate & SpO₂ charts.",
      "@mui/material and @mui/icons-material for UI icons and styling.",
      "Fetch API for HTTPS requests to https://sfwe513.publicvm.com/api."
    ]
  },
  {
    title: "Hardware / Firmware",
    items: [
      "Particle Photon 2 (P2) running Particle Device OS.",
      "SparkFun MAX3010x sensor library and spo2_algorithm for HR/SpO₂.",
      "Particle HttpClient for GET /api/device/config/:deviceId and POST /api/measurements with x-api-key.",
      "Offline queue in EEPROM; state machine for prompt/acquire/send."
    ]
  },
  {
    title: "Docs & Links",
    items: [
      "React docs: https://react.dev/",
      "Express docs: https://expressjs.com/",
      "Chart.js docs: https://www.chartjs.org/docs/latest/",
      "Particle webhooks: https://docs.particle.io/"
    ]
  }
];

export function ReferencePage() {
  return (
    <main className="page-container">
      <h1 className="page-title">References</h1>
      <p className="muted">
        Third-party APIs, libraries, and code used across the frontend, backend, and device.
      </p>

      <div className="simple-grid">
        {REFERENCE_SECTIONS.map((section) => (
          <div className="card" key={section.title}>
            <h2>{section.title}</h2>
            <ul className="feature-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}

export default ReferencePage;
