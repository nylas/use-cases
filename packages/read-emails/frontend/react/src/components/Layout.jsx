import React, { useState } from 'react';
import IconSync from './icons/icon-sync.svg';
import IconLogout from './icons/icon-logout.svg';
import NylasLogo from './icons/nylas-logo-horizontal.svg';
import PropTypes from 'prop-types';

const Layout = ({ children, showMenu = false, disconnectUser, refresh }) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const handleRefresh = (e) => {
    e.preventDefault();
    refresh();
  };

  const handleDisconnect = (e) => {
    e.preventDefault();
    setIsDisconnecting(true);
    setTimeout(() => {
      disconnectUser();
      setIsDisconnecting(false);
    }, 1500);
  };

  return (
    <div className="layout">
      <div className="title-menu">
        <h1>Email sample app</h1>
        {showMenu && (
          <div className="menu">
            <button onClick={handleRefresh}>
              <img src={IconSync} alt="Sync" height="18" />
              <span className="hidden-mobile">Refresh</span>
            </button>
            <div className="hidden-mobile">·</div>
            <button onClick={handleDisconnect} disabled={isDisconnecting}>
              <img src={IconLogout} alt="Logout" height="16" />
              <span className="hidden-mobile">
                {isDisconnecting ? 'Disconnect...' : 'Disconnect account'}
              </span>
            </button>
          </div>
        )}
      </div>
      <main>{children}</main>
      <footer>
        <div className="logo">
          POWERED BY
          <img src={NylasLogo} alt="Nylas Logo" />
        </div>
      </footer>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.element.isRequired,
  showMenu: PropTypes.bool.isRequired,
  disconnectUser: PropTypes.func,
  refresh: PropTypes.func,
};

export default Layout;
