import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import DeviceRegister from "./components/DeviceRegister";
import React from 'react';

import { Dashboard } from "./components/dashboard/Dashboard";
import HeaderBar from './components/headerbar/HeaderBar';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route index element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/device" element={<DeviceRegister />} />
        </Routes>
      </BrowserRouter>

    <div>
      <HeaderBar />
      <Dashboard userId='123' />
    </div>
    </div>
  );
}

export default App;
