import React, { useEffect, useState } from "react";

const API_BASE = "https://sfwe513.publicvm.com";

const AssignPhysician: React.FC = () => {
  const [physicians, setPhysicians] = useState<any[]>([]);
  const [selectedPhysician, setSelectedPhysician] = useState("");
  const [message, setMessage] = useState("");

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchPhysicians() {
      try {
        const res = await fetch(`${API_BASE}/api/physician/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          setPhysicians(data.physicians || []);
        } else {
          setMessage(data.error || "Failed to load physicians");
        }
      } catch (err: any) {
        setMessage("Network error: " + err.message);
      }
    }

    fetchPhysicians();
  }, [token]);

  async function handleAssign() {
    setMessage("");

    if (!selectedPhysician) {
      setMessage("Please select a physician");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/physician/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          physicianId: selectedPhysician,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Physician successfully assigned!");
      } else {
        setMessage(data.error || "Assignment failed");
      }
    } catch (err: any) {
      setMessage("Network error: " + err.message);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Assign Your Physician</h2>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <label>Select Physician:</label>
      <br />

      <select
        value={selectedPhysician}
        onChange={(e) => setSelectedPhysician(e.target.value)}
        style={{ marginTop: "10px" }}
      >
        <option value="">-- choose a physician --</option>
        {physicians.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name ? `${p.name} (${p.email})` : p.email}
          </option>
        ))}
      </select>

      <br /><br />

      <button onClick={handleAssign}>Assign Physician</button>
    </div>
  );
};

export default AssignPhysician;
