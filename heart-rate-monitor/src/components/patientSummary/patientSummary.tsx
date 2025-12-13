import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface DeviceSummary {
  device: { deviceId: string };
  latest: { bpm: number; timestamp: string } | null;
}

interface PatientSummaryData {
  patient: { id: string; email: string };
  summaries: DeviceSummary[];
}

const PatientSummary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PatientSummaryData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE || "http://localhost:5001"}/api/physician/patient/${id}/summary`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const result = await res.json();
        if (!res.ok) {
          setError(result.error || "Failed to fetch summary");
          return;
        }
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchSummary();
  }, [id]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h3>{data.patient.email} - Device Summary</h3>
      <ul>
        {data.summaries.map((s, idx) => (
          <li key={idx}>
            Device: {s.device.deviceId} | Latest: {s.latest ? `${s.latest.bpm} bpm at ${new Date(s.latest.timestamp).toLocaleTimeString()}` : "No data"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientSummary;
