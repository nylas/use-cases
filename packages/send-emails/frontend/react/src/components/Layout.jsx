import React, { useState, useEffect } from 'react';
import IconLogout from './icons/IconLogout.jsx';
import NylasLogo from './icons/nylas-logo-horizontal.svg';
import PropTypes from 'prop-types';
import Toast from './Toast';

const Layout = ({
  children,
  showMenu = false,
  disconnectUser,
  title,
  toastNotification,
  setToastNotification,
}) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
        <h1>{title || 'Sample app'}</h1>

        <Toast
          toastNotification={toastNotification}
          setToastNotification={setToastNotification}
        />
        {showMenu && (
          <div className="menu">
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting || toastNotification}
            >
              <div className="menu-icon">
                <IconLogout />
              </div>
              <span className="hidden-mobile">
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect account'}
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
  title: PropTypes.string,
  toastNotification: PropTypes.string,
  setToastNotification: PropTypes.func.isRequired,
};

export default Layout;
