import React from 'react'
import "./HeaderBar.css";
import { Logout, Phonelink, MonitorHeart } from "@mui/icons-material";
import { NavLink, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    // Remove saved login data
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");

    navigate("/login");
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className='headerbar'>
        <div className='headerbarwrapper'>
        <div className='topleft'>
          <span className='logo' onClick={() => navigate("/home")}>
            <MonitorHeart />Heart Rate Monitor
          </span>
        </div>

        <nav className="nav-links">
          {role === "physician" && (
            <NavLink to="/physician-dashboard/patients" className={getLinkClass}>
              Physician Dashboard
            </NavLink>
          )}
          {role !== "physician" && <NavLink to="/dashboard" className={getLinkClass}>Dashboard</NavLink>}
          <NavLink to="/reference" className={getLinkClass}>
            Reference
          </NavLink>
          <NavLink to="/account" className={getLinkClass}>
            Account
          </NavLink>
          {role !== "physician" && (
            <NavLink to="/device" className={getLinkClass}>
              Devices
            </NavLink>
          )}
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={getLinkClass}>
                Login
              </NavLink>
              <NavLink to="/signup" className={getLinkClass}>
                Sign Up
              </NavLink>
            </>
          )}
        </nav>

        <div className='topright'>

          {isAuthenticated && (
            <div className='headerIconsContainer' onClick={handleLogout}>
              <Logout />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
