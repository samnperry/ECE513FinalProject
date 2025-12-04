import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import DeviceRegister from "./components/DeviceRegister";

import { Dashboard } from "./components/dashboard/Dashboard"; 
import HeaderBar from "./components/headerbar/HeaderBar";
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
          {/* default route → login (original flow) */}
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

          {/* dashboard route */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard userId="123" />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
