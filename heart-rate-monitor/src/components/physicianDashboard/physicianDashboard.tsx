import React from "react";
import { Link, Outlet } from "react-router-dom";

const PhysicianDashboard: React.FC = () => {
  return (
    <div>
      <h2>Physician Dashboard</h2>
      <nav>
        <Link to="patients">All Patients</Link>
      </nav>
      <Outlet />
    </div>
  );
};

export default PhysicianDashboard;
