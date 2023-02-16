import React from 'react';
import PropTypes from 'prop-types';
import SuccessIcon from './icons/icon-success.svg';
import ErrorIcon from './icons/icon-error.svg';
import CloseIcon from './icons/icon-close.svg';
import { useEffect } from 'react';

function Toast({ toastNotification, setToastNotification }) {
  useEffect(() => {
    setTimeout(() => {
      if (toastNotification) {
        setToastNotification('');
      }
    }, 5500);
  }, [toastNotification]);

  const icons = { success: SuccessIcon, error: ErrorIcon, close: CloseIcon };
  const message = {
    success: 'Message sent',
    error: 'Failed to send message',
  };

  return (
    toastNotification && (
      <div className={`toast ${toastNotification}`}>
        <img src={icons[toastNotification]} alt={toastNotification} />
        {message[toastNotification]}
        <img
          src={icons.close}
          alt="Close"
          className="close"
          onClick={() => setToastNotification('')}
        />
      </div>
    )
  );
}

Toast.propTypes = {
  toastNotification: PropTypes.string,
  setToastNotification: PropTypes.func,
};

export default Toast;
