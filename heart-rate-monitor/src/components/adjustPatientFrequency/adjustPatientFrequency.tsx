import React, { useState } from "react";

type Props = { deviceId: string };

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const AdjustPatientFrequency: React.FC<Props> = ({ deviceId }) => {
  const [minutes, setMinutes] = useState<number>(15);
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    setMessage("");
    if (!minutes || minutes <= 0) {
      setMessage("Enter a positive number of minutes.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/physician/device/${deviceId}/frequency`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seconds: minutes * 60 })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to update");
        return;
      }
      setMessage(data.message || "Frequency updated");
    } catch (err: any) {
      setMessage(err.message || "Failed to update");
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
      <label style={{ fontWeight: 600 }}>Override interval:</label>
      <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
        <option value={5}>5 min</option>
        <option value={10}>10 min</option>
        <option value={15}>15 min</option>
        <option value={30}>30 min</option>
        <option value={60}>60 min</option>
      </select>
      <button type="button" onClick={handleUpdate}>
        Apply
      </button>
      {message && (
        <span style={{ color: message.toLowerCase().includes("fail") ? "red" : "green" }}>{message}</span>
      )}
    </div>
  );
};

export default AdjustPatientFrequency;
