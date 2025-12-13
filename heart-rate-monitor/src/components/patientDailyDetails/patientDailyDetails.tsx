import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

interface HeartEntry {
  bpm: number;
  spo2?: number;
  timestamp: string;
}

interface DeviceDetail {
  device: { deviceId: string };
  entries: HeartEntry[];
}

interface PatientDaily {
  date: string;
  details: DeviceDetail[];
}

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5001";

const PatientDailyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PatientDaily | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchDaily = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${API_BASE}/api/physician/patient/${id}/daily?date=${date}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const result = await res.json();
        if (!res.ok) {
          setError(result.error || "Failed to fetch daily data");
          return;
        }
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchDaily();
  }, [id, date]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="section-header" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Daily Details</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label htmlFor="date">Date:</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => {
              setSearchParams({ date: e.target.value });
              navigate(`?date=${e.target.value}`);
            }}
          />
        </div>
      </div>

      {data.details.length === 0 ? (
        <p className="muted">No measurements for this day.</p>
      ) : (
        data.details.map((d, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <strong>Device: {d.device.deviceId}</strong>
            <ul>
              {d.entries.map((e, i) => (
                <li key={i}>
                  {new Date(e.timestamp).toLocaleTimeString()}: {e.bpm} bpm
                  {e.spo2 !== undefined ? ` | SpO2 ${e.spo2}%` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default PatientDailyDetails;
