import React, { useState } from "react";

const DeviceRegister: React.FC = function() {
  const [deviceId, setDeviceId] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async function(e: React.FormEvent) {
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
      }

      setMessage(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register Device</h2>
      <input
        type="text"
        placeholder="Photon 2 Device ID"
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button type="submit">Register Device</button>
      {message && <p style={{ color: "red" }}>{message}</p>}
    </form>
  );
};

export default DeviceRegister;
