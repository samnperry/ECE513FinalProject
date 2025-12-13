import React, { useEffect, useState } from "react";
import "./Pages.css";

type Physician = { _id: string; email: string; name?: string };
type DeviceRecord = { _id: string; deviceId: string; nickname?: string };

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

export function AccountPage() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const isStrongPassword = (pw: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(pw);

  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceNickname, setDeviceNickname] = useState("");
  const [removeDeviceId, setRemoveDeviceId] = useState("");
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [selectedPhysician, setSelectedPhysician] = useState("");
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [selectedDeviceForRemoval, setSelectedDeviceForRemoval] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPhysicians = async () => {
      if (!token) {
        setError("Login required to load physicians.");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/physician/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load physicians");
          return;
        }
        setPhysicians(data.physicians || []);
      } catch (err: any) {
        setError(err.message || "Failed to load physicians");
      }
    };
    loadPhysicians();
  }, [token]);

  useEffect(() => {
    const loadDevices = async () => {
      if (!token) {
        setError("Login required to load devices.");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/device/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load devices");
          return;
        }
        setDevices(data.devices || []);
      } catch (err: any) {
        setError(err.message || "Failed to load devices");
      }
    };
    loadDevices();
  }, [token]);

  const handleUpdatePassword = async () => {
    setStatus(null);
    setError(null);
    if (!password.trim()) {
      setError("Enter a new password.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 chars with upper, lower, number, and special character.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/account/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setStatus("Password updated");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Update failed");
    }
  };

  const handleRegisterDevice = async () => {
    setStatus(null);
    setError(null);
    if (!deviceId.trim()) {
      setError("Enter a device ID to register.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ deviceId, nickname: deviceNickname || deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Device registration failed");
        return;
      }
      setStatus("Device registered");
      setDeviceId("");
      setDeviceNickname("");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  const handleRemoveDevice = async () => {
    setStatus(null);
    setError(null);
    const idToRemove = selectedDeviceForRemoval || removeDeviceId;
    if (!idToRemove.trim()) {
      setError("Select a device record ID to remove.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/device/${idToRemove}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Device removal failed");
        return;
      }
      setStatus("Device removed");
      setRemoveDeviceId("");
      setSelectedDeviceForRemoval("");
      // refresh devices
      const refreshed = await fetch(`${API_BASE}/api/device/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const refreshedData = await refreshed.json();
      if (refreshed.ok) setDevices(refreshedData.devices || []);
    } catch (err: any) {
      setError(err.message || "Removal failed");
    }
  };

  const handleAssignPhysician = async () => {
    setStatus(null);
    setError(null);
    if (!userId || !selectedPhysician) {
      setError("Select a physician before assigning.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/physician/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ userId, physicianId: selectedPhysician }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Assignment failed");
        return;
      }
      setStatus("Physician assigned");
    } catch (err: any) {
      setError(err.message || "Assignment failed");
    }
  };

  return (
    <main className="page-container">
      <h1 className="page-title">Account</h1>
      {error && <div className="error-text">{error}</div>}
      {status && <div className="info-banner">{status}</div>}

      <div className="simple-grid">
        <div className="card">
          <h2>Profile</h2>
          <p className="muted">Update your password. Email changes are not allowed.</p>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="full-width"
            />
            <div className="inline-actions">
              <button className="primary-btn" type="button" onClick={handleUpdatePassword}>
                Save changes
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Devices</h2>
          <p className="muted">Add/remove linked devices and set nicknames.</p>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Device ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="full-width"
            />
            <input
              type="text"
              placeholder="Nickname (optional)"
              value={deviceNickname}
              onChange={(e) => setDeviceNickname(e.target.value)}
              className="full-width"
            />
            <button className="primary-btn" type="button" onClick={handleRegisterDevice}>
              Add device
            </button>
          </div>
          <div className="form-actions" style={{ marginTop: 10 }}>
            <select
              value={selectedDeviceForRemoval}
              onChange={(e) => setSelectedDeviceForRemoval(e.target.value)}
              className="full-width"
            >
              <option value="">Select a device to remove</option>
              {devices.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.deviceId} {d.nickname ? `(${d.nickname})` : ""}
                </option>
              ))}
            </select>
            <button className="outline-button full-width" type="button" onClick={handleRemoveDevice}>
              Remove device
            </button>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Note: removal expects the device record ID (from the database). Registering uses the public device ID.
          </p>
          {devices.length > 0 && (
            <p className="muted" style={{ marginTop: 6 }}>
              Linked devices:{" "}
              {devices.map((d) => `${d.deviceId}${d.nickname ? ` (${d.nickname})` : ""}`).join(", ")}
            </p>
          )}
        </div>

        <div className="card">
          <h2>Physician</h2>
          <p className="muted">Choose a physician to link with your account.</p>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <select
              value={selectedPhysician}
              onChange={(e) => setSelectedPhysician(e.target.value)}
              className="full-width"
            >
              <option value="">Select physician</option>
              {physicians.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.email}
                </option>
              ))}
            </select>
            <button className="primary-btn" type="button" onClick={handleAssignPhysician}>
              Assign physician
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AccountPage;
