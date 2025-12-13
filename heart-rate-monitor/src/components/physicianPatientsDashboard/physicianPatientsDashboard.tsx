import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Patient {
  _id: string;
  email: string;
  devices: any[];
}

const PhysicianPatientDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE || "http://localhost:5001"}/api/physician/patients`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
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
    <div>
      <h3>All Patients</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {patients.map(p => (
          <li key={p._id}>
            {p.email} ({p.devices.length} devices) -{" "}
            <Link to={`/physician-dashboard/patient/${p._id}/summary`}>Summary</Link> |{" "}
            <Link to={`/physician-dashboard/patient/${p._id}/daily?date=${new Date().toISOString().slice(0,10)}`}>Daily</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PhysicianPatientDashboard;
