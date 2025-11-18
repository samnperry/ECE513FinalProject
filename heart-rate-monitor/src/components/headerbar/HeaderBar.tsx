import React from 'react'
import "./HeaderBar.css"
import {Logout, Phonelink,MonitorHeart} from '@mui/icons-material';

export default function Header() {
    const handleLogout = () => {
    console.log("Logout clicked");


  };

  return (

    <div className='headerbar'>
      <div className='headerbarwrapper'>
        <div className='topleft'>
          <span className='logo'><MonitorHeart />Heart Rate Monitor</span>
        </div>
        <div className='topright'>
                    <div className='headerIconsContainer'>
            <Phonelink/>
          </div>
          <div className='headerIconsContainer' onClick={handleLogout}>
            <Logout/>
          </div>

        </div>
      </div>

    </div>
  )
}
