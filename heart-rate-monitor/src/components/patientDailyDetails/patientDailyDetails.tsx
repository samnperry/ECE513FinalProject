import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";

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

const API_BASE = "https://sfwe513.publicvm.com";

const PatientDailyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PatientDaily | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const chartRefs = useRef<Record<string, Chart | null>>({});
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

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

  useEffect(() => {
    if (!data) return;
    data.details.forEach((d) => {
      const canvas = canvasRefs.current[d.device.deviceId];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const labels = d.entries.map((e) =>
        new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      const hr = d.entries.map((e) => e.bpm);
      const sp = d.entries.map((e) => e.spo2 ?? null);

      chartRefs.current[d.device.deviceId]?.destroy();

      chartRefs.current[d.device.deviceId] = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Heart Rate",
              data: hr,
              backgroundColor: "rgba(37, 99, 235, 0.65)",
              borderColor: "#2563eb",
            },
            {
              label: "SpO2",
              data: sp,
              backgroundColor: "rgba(16, 185, 129, 0.65)",
              borderColor: "#10b981",
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: { ticks: { autoSkip: true, maxTicksLimit: 8 } },
            y: { beginAtZero: false },
          },
        },
      });
    });

    return () => {
      Object.values(chartRefs.current).forEach((c) => c?.destroy());
    };
  }, [data]);

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
          <div key={idx} style={{ marginBottom: 16 }}>
            <strong>Device: {d.device.deviceId}</strong>
            <div style={{ height: 240, marginTop: 8 }}>
              <canvas
                ref={(el) => {
                  canvasRefs.current[d.device.deviceId] = el;
                }}
                aria-label={`Daily chart for device ${d.device.deviceId}`}
              />
            </div>
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
