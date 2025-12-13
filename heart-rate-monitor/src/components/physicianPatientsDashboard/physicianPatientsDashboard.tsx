import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Patient {
  _id: string;
  email: string;
  devices: any[];
}

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const PhysicianPatientDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE}/api/physician/patients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to fetch patients");
          return;
        }
        setPatients(data.patients);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="card">
      <div className="section-header" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>All Patients</h3>
        <p className="muted" style={{ margin: 0 }}>
          API: {API_BASE}/api/physician/patients
        </p>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {patients.length === 0 ? (
        <p className="muted">No patients assigned yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="weekly-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Devices</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>{p.email}</td>
                  <td>{p.devices.length}</td>
                  <td>
                    <Link to={`/physician-dashboard/patient/${p._id}/summary`}>Summary</Link>{" "}
                    |{" "}
                    <Link to={`/physician-dashboard/patient/${p._id}/daily?date=${new Date()
                      .toISOString()
                      .slice(0, 10)}`}>
                      Daily
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PhysicianPatientDashboard;
