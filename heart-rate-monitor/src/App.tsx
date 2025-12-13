import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/login/Login";
import Signup from "./components/signup/Signup";
import DeviceRegister from "./components/deviceRegister/DeviceRegister";
import { Dashboard } from "./components/dashboard/Dashboard";
import HeaderBar from "./components/headerbar/HeaderBar";
import PhysicianDashboard from "./components/physicianDashboard/physicianDashboard";
import AssignPhysician from "./components/assignPhysician/assignPhysician";
import PhysicianPatientDashboard from "./components/physicianPatientsDashboard/physicianPatientsDashboard";
import PatientSummary from "./components/patientSummary/patientSummary";
import PatientDailyDetails from "./components/patientDailyDetails/patientDailyDetails";
import HomePage from "./components/pages/HomePage";
import ReferencePage from "./components/pages/ReferencePage";
import AccountPage from "./components/pages/AccountPage";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <HeaderBar />
        <Routes>
          {/* Default routes → login */}
          <Route index element={<Login />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/device"
            element={
              <RequireAuth>
                <DeviceRegister />
              </RequireAuth>
            }
          />
          <Route
            path="/reference"
            element={
              <RequireAuth>
                <ReferencePage />
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />

          {/* User dashboard */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard userId="123" />
              </RequireAuth>
            }
          />

          {/* Physician routes */}
          <Route
            path="/assign-physician"
            element={
              <RequireAuth>
                <AssignPhysician />
              </RequireAuth>
            }
          />
          <Route
            path="/physician-dashboard"
            element={
              <RequireAuth>
                <PhysicianDashboard />
              </RequireAuth>
            }
          >
            {/* Nested physician routes */}
            <Route
              path="patients"
              element={
                <RequireAuth>
                  <PhysicianPatientDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="patient/:id/summary"
              element={
                <RequireAuth>
                  <PatientSummary />
                </RequireAuth>
              }
            />
            <Route
              path="patient/:id/daily"
              element={
                <RequireAuth>
                  <PatientDailyDetails />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
