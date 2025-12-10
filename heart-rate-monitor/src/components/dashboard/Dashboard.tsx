import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "./Dashboard.css";

type DashboardProps = {
  userId: string;
};

type Measurement = {
  deviceId: string;
  heartRate: number;
  spo2: number;
  timestamp: string;
};

type DaySummary = {
  label: string;
  date: string;
  count: number;
  avgHeartRate: number | null;
  avgSpO2: number | null;
  minHeartRate: number | null;
  maxHeartRate: number | null;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Dashboard({ userId: _userId }: DashboardProps) {
  const [deviceId, setDeviceId] = useState(
    () => localStorage.getItem("deviceId") ?? ""
  );
  const [rawOutput, setRawOutput] = useState("");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [measurementFrequency, setMeasurementFrequency] = useState<string>(
    () => localStorage.getItem("measurementFrequency") ?? "15"
  );
  const [physicianFrequency, setPhysicianFrequency] = useState<string>(
    () => localStorage.getItem("physicianFrequency") ?? ""
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const chartRef = useRef<Chart | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const API_BASE = "http://localhost:5001"; // backend
  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  const registerDevice = async () => {
    setError("");
    if (!deviceId.trim()) {
      setError("Enter a device ID before registering.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          deviceId,
          nickname: deviceId,
        }),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      const data = await res.json();
      setRawOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setError("Error registering device");
    }
  };

  const loadMeasurements = async () => {
    setError("");
    if (!deviceId.trim()) {
      setError("Enter a device ID to view measurements.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/measurements/${encodeURIComponent(deviceId)}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load measurements");
      }

      const data: Measurement[] = await res.json();
      setMeasurements(data);
      setRawOutput(JSON.stringify(data, null, 2));
      setLastUpdated(new Date());
      localStorage.setItem("deviceId", deviceId);
    } catch (err) {
      setError("Error loading measurements");
    } finally {
      setLoading(false);
    }
  };

  const weeklySummary = useMemo(() => {
    const baseMeasurements =
      startDate || endDate
        ? measurements.filter((m) => {
            const ts = new Date(m.timestamp).getTime();
            const afterStart = startDate ? ts >= new Date(startDate).getTime() : true;
            const beforeEnd = endDate ? ts <= new Date(endDate).getTime() : true;
            return afterStart && beforeEnd;
          })
        : measurements;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6); // include today + 6 days back

    const recent = baseMeasurements.filter((m) => {
      const ts = new Date(m.timestamp);
      return ts >= start;
    });

    const days: DaySummary[] = Array.from({ length: 7 }).map((_, idx) => {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + idx);

      const forDay = recent.filter((m) =>
        isSameDay(new Date(m.timestamp), dayDate)
      );

      const count = forDay.length;
      const avgHeartRate =
        count === 0
          ? null
          : Math.round(
              forDay.reduce((sum, m) => sum + m.heartRate, 0) / count
            );
      const avgSpO2 =
        count === 0
          ? null
          : Math.round(forDay.reduce((sum, m) => sum + m.spo2, 0) / count);

      const minHeartRate =
        count === 0 ? null : Math.min(...forDay.map((m) => m.heartRate));
      const maxHeartRate =
        count === 0 ? null : Math.max(...forDay.map((m) => m.heartRate));

      return {
        label: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        date: dayDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
        avgHeartRate,
        avgSpO2,
        minHeartRate,
        maxHeartRate,
      };
    });

    const totalReadings = recent.length;
    const avgHeartRate =
      totalReadings === 0
        ? null
        : Math.round(
            recent.reduce((sum, m) => sum + m.heartRate, 0) / totalReadings
          );
    const avgSpO2 =
      totalReadings === 0
        ? null
        : Math.round(
            recent.reduce((sum, m) => sum + m.spo2, 0) / totalReadings
          );

    return {
      days,
      totals: {
        totalReadings,
        avgHeartRate,
        avgSpO2,
      },
    };
  }, [measurements, startDate, endDate]);

  const formatValue = (value: number | null, suffix = "") =>
    value == null ? "—" : `${value}${suffix}`;

  const effectiveFrequency = physicianFrequency || measurementFrequency;

  const savePatientFrequency = () => {
    setStatusMessage(`Measurement frequency set to every ${measurementFrequency} minutes.`);
  };

  const savePhysicianFrequency = () => {
    if (!physicianFrequency) {
      setStatusMessage("Physician override cleared. Using patient preference.");
      return;
    }
    setStatusMessage(
      `Physician override set to every ${physicianFrequency} minutes. Patients cannot change until cleared.`
    );
  };

  const dailySeries = useMemo(() => {
    const filtered =
      startDate || endDate
        ? measurements.filter((m) => {
            const ts = new Date(m.timestamp).getTime();
            const afterStart = startDate ? ts >= new Date(startDate).getTime() : true;
            const beforeEnd = endDate ? ts <= new Date(endDate).getTime() : true;
            return afterStart && beforeEnd;
          })
        : (() => {
            const cutoff = new Date();
            cutoff.setHours(cutoff.getHours() - 24);
            return measurements.filter(
              (m) => new Date(m.timestamp).getTime() >= cutoff.getTime()
            );
          })();

    const sorted = [...filtered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const labels = filtered.map((m) =>
      new Date(m.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    const heartRates = filtered.map((m) => m.heartRate);
    const spO2s = filtered.map((m) => m.spo2);

    return {
      labels,
      heartRates,
      spO2s,
    };
  }, [measurements, startDate, endDate]);

  useEffect(() => {
    localStorage.setItem("measurementFrequency", measurementFrequency);
  }, [measurementFrequency]);

  useEffect(() => {
    if (physicianFrequency) {
      localStorage.setItem("physicianFrequency", physicianFrequency);
    } else {
      localStorage.removeItem("physicianFrequency");
    }
  }, [physicianFrequency]);

  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (!dailySeries.labels.length) {
      chartRef.current?.destroy();
      chartRef.current = null;
      return;
    }

    const ctx = chartCanvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: dailySeries.labels,
        datasets: [
          {
            label: "Heart rate",
            data: dailySeries.heartRates,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "SpO2",
            data: dailySeries.spO2s,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
            },
          },
          tooltip: {
            intersect: false,
            mode: "index",
          },
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 8,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => `${value}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [dailySeries]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Weekly summary</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Pull the last 50 measurements for your device and get a seven-day
            snapshot of heart rate and SpO2 trends.
          </p>
        </div>
        <div className="device-card card">
          <label className="field-label" htmlFor="deviceId">
            Device ID
          </label>
          <div className="device-input-row">
            <input
              id="deviceId"
              type="text"
              placeholder="Enter device ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
            <button
              className="primary-button"
              disabled={loading}
              onClick={loadMeasurements}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div className="device-actions">
            <button
              className="link-button"
              type="button"
              disabled={loading}
              onClick={registerDevice}
            >
              Register device
            </button>
            <button
              className="link-button"
              type="button"
              onClick={() => navigate("/assign-physician")}
            >
              Assign physician
            </button>
          </div>
          <p className="helper">
            Stores the device and fetches the latest 50 readings.
          </p>
        </div>
        <div className="card filter-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Time range</p>
              <h2>Filter measurements</h2>
              <p className="muted">
                Optional start/end times to focus charts on a specific window.
              </p>
            </div>
            {(startDate || endDate) && (
              <button
                className="link-button"
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="filter-row">
            <div className="filter-field">
              <label className="field-label" htmlFor="startDate">
                Start
              </label>
              <input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-field">
              <label className="field-label" htmlFor="endDate">
                End
              </label>
              <input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="helper">
            If blank, defaults to last 24 hours for the chart and last 7 days for
            the summary.
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {statusMessage && <div className="info-banner">{statusMessage}</div>}

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Measurement frequency</h2>
            <p className="muted">
              Configure how often devices send readings. Physician overrides win
              over patient preferences.
            </p>
          </div>
          <span className="pill">Active: every {effectiveFrequency} min</span>
        </div>
        <div className="settings-grid">
          <div className="settings-panel">
            <p className="eyebrow">Patient preference</p>
            <div className="settings-row">
              <select
                value={measurementFrequency}
                onChange={(e) => setMeasurementFrequency(e.target.value)}
              >
                <option value="5">Every 5 minutes</option>
                <option value="10">Every 10 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every 60 minutes</option>
              </select>
              <button
                className="outline-button full-width"
                type="button"
                onClick={savePatientFrequency}
              >
                Save preference
              </button>
            </div>
            <p className="helper">
              Saved locally for now. Backend integration can persist per-user.
            </p>
          </div>

          <div className="settings-panel">
            <p className="eyebrow">Physician override</p>
            <div className="settings-row">
              <select
                value={physicianFrequency}
                onChange={(e) => setPhysicianFrequency(e.target.value)}
              >
                <option value="">No override</option>
                <option value="5">Every 5 minutes</option>
                <option value="10">Every 10 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every 60 minutes</option>
              </select>
              <div className="settings-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={savePhysicianFrequency}
                >
                  Apply override
                </button>
                <button
                  className="link-button"
                  type="button"
                  onClick={() => setPhysicianFrequency("")}
                >
                  Clear override
                </button>
              </div>
            </div>
            <p className="helper">
              When set, this value locks the measurement interval. Clear to
              return to patient control.
            </p>
          </div>
        </div>
      </section>

      <section className="summary-grid">
        <div className="card summary-card">
          <p className="muted">Avg heart rate (7d)</p>
          <div className="stat-value">
            {formatValue(weeklySummary.totals.avgHeartRate, " bpm")}
          </div>
          <p className="stat-sub">Across last 7 days</p>
        </div>
        <div className="card summary-card">
          <p className="muted">Avg SpO2 (7d)</p>
          <div className="stat-value">
            {formatValue(weeklySummary.totals.avgSpO2, "%")}
          </div>
          <p className="stat-sub">Across last 7 days</p>
        </div>
        <div className="card summary-card">
          <p className="muted">Readings collected</p>
          <div className="stat-value">
            {weeklySummary.totals.totalReadings || "—"}
          </div>
          <p className="stat-sub">From last 7 days</p>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Weekly breakdown</h2>
            <p className="muted">
              Average heart rate and SpO2 per day. Older than 7 days is hidden.
            </p>
          </div>
          {lastUpdated && (
            <span className="pill">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading measurements…</div>
        ) : weeklySummary.totals.totalReadings === 0 ? (
          <div className="empty-state">
            <p className="muted">No data for the last 7 days. Try refreshing.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="weekly-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Avg HR</th>
                  <th>Avg SpO2</th>
                  <th>Range (HR)</th>
                  <th>Readings</th>
                </tr>
              </thead>
              <tbody>
                {weeklySummary.days.map((day) => (
                  <tr key={day.date}>
                    <td>
                      <div className="day-label">
                        <span className="eyebrow">{day.label}</span>
                        <span>{day.date}</span>
                      </div>
                    </td>
                    <td>{formatValue(day.avgHeartRate, " bpm")}</td>
                    <td>{formatValue(day.avgSpO2, "%")}</td>
                    <td>
                      {day.minHeartRate == null || day.maxHeartRate == null
                        ? "—"
                        : `${day.minHeartRate}–${day.maxHeartRate} bpm`}
                    </td>
                    <td>{day.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Daily details (last 24h)</h2>
            <p className="muted">
              Heart rate and SpO2 plotted by timestamp to spot trends and
              spikes.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading measurements…</div>
        ) : dailySeries.labels.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              No measurements in the last 24 hours. Refresh to see today&apos;s
              chart.
            </p>
          </div>
        ) : (
          <div className="chart-card">
            <div className="chart-area">
              <canvas ref={chartCanvasRef} aria-label="Daily detail chart" />
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Raw API output</h2>
          <p className="muted">Quick view of the latest response for debugging.</p>
        </div>
        <textarea
          id="rxData"
          title="rxData"
          readOnly
          value={rawOutput}
          placeholder="Run a refresh to see device data."
        ></textarea>
      </section>
    </div>
  );
}
