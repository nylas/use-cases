import React from 'react';
import IconSync from './icons/icon-sync.svg';
import IconLogout from './icons/icon-logout.svg';
import NylasLogo from './icons/nylas-logo-horizontal.svg';
import PropTypes from 'prop-types';

const Layout = ({ children, showMenu = false, disconnectUser }) => {
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
            <button onClick={disconnectUser}>
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

Layout.propTypes = {
  children: PropTypes.element.isRequired,
  showMenu: PropTypes.bool.isRequired,
  disconnectUser: PropTypes.func,
};

export default Layout;
