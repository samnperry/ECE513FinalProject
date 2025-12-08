import React, { useState } from "react";
import "../pages/Pages.css";

const DeviceRegister: React.FC = function () {
  const [deviceId, setDeviceId] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async function (e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You must be logged in to register a device.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/device/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId, nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Registration failed");
        return;
      }
      
      setMessage(`Device registered successfully! ID: ${data.device.id}`);
      setDeviceId("");
      setNickname("");

    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setMessage("Network error: " + err?.message);
    }
  };

  return (
    <main className="page-container auth-page">
      <div className="card form-card">
        <h2>Register Device</h2>
        <form className="form-actions" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Photon 2 Device ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
            className="full-width"
          />
          <input
            type="text"
            placeholder="Nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="full-width"
          />
          <button className="primary-btn" type="submit">
            Register Device
          </button>
          {message && (
            <p
              style={{
                color: message.includes("successfully") ? "green" : "#b91c1c",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
};

export default DeviceRegister;
