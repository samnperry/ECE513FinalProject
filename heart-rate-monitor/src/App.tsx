import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import DeviceRegister from "./components/DeviceRegister";

import { Dashboard } from "./components/dashboard/Dashboard"; 
import HeaderBar from "./components/headerbar/HeaderBar";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* default route → login */}
          <Route index element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/device" element={<DeviceRegister />} />

          {/* dashboard route with header + dashboard together */}
          <Route
            path="/dashboard"
            element={
              <>
                <HeaderBar />
                <Dashboard userId="123" />
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
