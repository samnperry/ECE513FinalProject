import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

interface HeartEntry {
  bpm: number;
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

const PatientDailyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PatientDaily | null>(null);
  const [error, setError] = useState("");
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchDaily = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5001/api/physician/patient/${id}/daily?date=${date}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
    <div>
      <h3>Daily Details - {data.date}</h3>
      {data.details.map((d, idx) => (
        <div key={idx}>
          <strong>Device: {d.device.deviceId}</strong>
          <ul>
            {d.entries.map((e, i) => (
              <li key={i}>{new Date(e.timestamp).toLocaleTimeString()}: {e.bpm} bpm</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PatientDailyDetails;
