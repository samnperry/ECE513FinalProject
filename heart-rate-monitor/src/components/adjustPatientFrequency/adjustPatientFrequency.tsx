import React, { useState } from "react";

const AdjustPatientFrequency: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const [seconds, setSeconds] = useState<number>(5);
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/physician/device/${deviceId}/frequency`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seconds })
      });
      const data = await res.json();
      setMessage(data.message || "Updated");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <input type="number" value={seconds} onChange={e => setSeconds(Number(e.target.value))} />
      <button onClick={handleUpdate}>Update Frequency</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AdjustPatientFrequency;
