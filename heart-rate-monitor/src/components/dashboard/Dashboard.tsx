import React, { useState } from "react";
import "./Dashboard.css";


type DashboardProps = {
  userId: string;
};

export function Dashboard({ userId }: DashboardProps) {



 return (
  <div className="dashboard-container">
    <div className="button-container">
    <button>Register Device</button>
    <button>Load Device</button>
    </div>
    <textarea id="rxData" title="rxData" readOnly></textarea>
  </div>
);

}
