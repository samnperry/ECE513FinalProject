import React from 'react'
import "./HeaderBar.css"
import { Logout, Phonelink, MonitorHeart } from '@mui/icons-material';
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove saved login data
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    navigate("/login");
  };

  return (
    <div className='headerbar'>
      <div className='headerbarwrapper'>
        <div className='topleft'>
          <span className='logo'><MonitorHeart />Heart Rate Monitor</span>
        </div>

        <div className='topright'>
          <div className='headerIconsContainer'>
            {/* placeholder for now */}
            <Phonelink /> 
          </div>

          <div className='headerIconsContainer' onClick={handleLogout}>
            <Logout />
          </div>
        </div>
      </div>
    </div>
  )
}
