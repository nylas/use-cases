import React from 'react';
import IconSync from './icons/icon-sync.svg';
import IconLogout from './icons/icon-logout.svg';
import NylasLogo from './icons/nylas-logo-horizontal.svg';

const Layout = ({ children, showMenu = false }) => {
  return (
    <div className="layout">
      <div className="title-menu">
        <h1>Email sample app</h1>
        {showMenu && (
          <div className="menu">
            <button>
              <img src={IconSync} alt="Your SVG" height="18" />
              Refresh
            </button>
            ·
            <button>
              <img src={IconLogout} alt="Your SVG" height="16" />
              Disconnect account
            </button>
          </div>
        )}
      </div>
      <main>{children}</main>
      <footer>
        <div className="logo">
          POWERED BY
          <img src={NylasLogo} alt="Your SVG" />
        </div>
      </footer>
    </div>
  );
};

export default Layout;
