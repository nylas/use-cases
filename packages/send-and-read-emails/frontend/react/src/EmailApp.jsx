import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import './styles/email.scss';

function EmailApp({ userEmail, emails, isLoading, serverBaseUrl, userId }) {
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    setSelectedEmail(null);
  }, [emails]);

  return (
    <>
      <div className="email-app">
        {isLoading ? (
          <p className="loading-text">Loading emails...</p>
        ) : emails.length ? (
          <>
            <EmailList
              emails={emails}
              selectedEmail={selectedEmail}
              setSelectedEmail={setSelectedEmail}
            />
            <EmailDetail
              selectedEmail={selectedEmail}
              userEmail={userEmail}
              serverBaseUrl={serverBaseUrl}
              userId={userId}
            />
          </>
        ) : (
          <p className="loading-text">No available email</p>
        )}
      </div>
      <div className="mobile-warning hidden-desktop">
        <h2>
          Email sample app is currently designed for a desktop experience.
        </h2>
        <p>
          Visit Nylas dashboard for more use-cases: https://dashboard.nylas.com
        </p>
      </div>
    </>
  );
}

EmailApp.propTypes = {
  userEmail: PropTypes.string.isRequired,
  emails: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default EmailApp;
