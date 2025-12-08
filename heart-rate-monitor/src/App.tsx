import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/login/Login";
import Signup from "./components/signup/Signup";
import DeviceRegister from "./components/deviceRegister/DeviceRegister";
import { Dashboard } from "./components/dashboard/Dashboard";
import HeaderBar from "./components/headerBar/HeaderBar";
import PhysicianDashboard from "./components/physicianDashboard/physicianDashboard";
import AssignPhysician from "./components/assignPhysician/assignPhysician";
import PhysicianPatientDashboard from "./components/physicianPatientsDashboard/physicianPatientsDashboard";
import PatientSummary from "./components/patientSummary/patientSummary";
import PatientDailyDetails from "./components/patientDailyDetails/patientDailyDetails";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Default routes → login */}
          <Route index element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/device" element={<DeviceRegister />} />

          {/* User dashboard */}
          <Route
            path="/dashboard"
            element={
              <>
                <HeaderBar />
                <Dashboard userId="123" />
              </>
            }
          />

          {/* Physician routes */}
          <Route path="/assign-physician" element={<AssignPhysician />} />
          <Route path="/physician-dashboard" element={<PhysicianDashboard />}>
            {/* Nested physician routes */}
            <Route path="patients" element={<PhysicianPatientDashboard />} />
            <Route path="patient/:id/summary" element={<PatientSummary />} />
            <Route path="patient/:id/daily" element={<PatientDailyDetails />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
