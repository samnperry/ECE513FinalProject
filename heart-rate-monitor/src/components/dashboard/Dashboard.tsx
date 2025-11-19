import React, { useState } from "react";
import "./Dashboard.css";

type DashboardProps = {
  userId: string;
};

export function Dashboard({ userId }: DashboardProps) {
  const [deviceId, setDeviceId] = useState("");
  const [output, setOutput] = useState("");

  const API_BASE = "http://localhost:5001"; // backend
  
  const token = localStorage.getItem("token");

  const registerDevice = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          deviceId,
          nickname: deviceId, // simple for milestone
        }),
      });

      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput("Error registering device");
    }
  };

  const loadMeasurements = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/measurements/${encodeURIComponent(deviceId)}`
      );
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2)); // show in textarea
    } catch (err) {
      setOutput("Error loading measurements");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="button-row">
        <input
          type="text"
          placeholder="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
        <button onClick={registerDevice}>Register Device</button>
        <button onClick={loadMeasurements}>Load Measurements</button>
      </div>

      <textarea
        id="rxData"
        title="rxData"
        readOnly
        value={output}
      ></textarea>
    </div>
  );
}
