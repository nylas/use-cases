import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SendEmails from './SendEmails';
import './styles/email.scss';

function EmailApp({ serverBaseUrl, userId, setToastNotification }) {
  const [draftEmail, setDraftEmail] = useState(null);

  useEffect(() => {
    // if (!draftEmail)
    composeEmail();
  }, []);

  const composeEmail = () => {
    // console.log(draftEmail);
    // alert('get here');
    if (draftEmail) {
      // Open the existing draft email
      setDraftEmail((prev) => ({ ...prev }));
    } else {
      // Create new draft email
      const currentDate = new Date();
      const newDraft = {
        object: 'draft',
        to: '',
        subject: '',
        body: '',
        last_message_timestamp: Math.floor(currentDate.getTime() / 1000),
        // isOpen: true,
      };
      setDraftEmail(newDraft);
    }
  };

  const onEmailSent = () => {
    setDraftEmail(null);
    // reloadEmail();
    setToastNotification('success');
    // composeEmail();
  };

  return (
    <>
      <div className="email-app">
        {!draftEmail ? (
          <p className="loading-text">Loading composer...</p>
        ) : (
          <SendEmails
            userId={userId}
            setToastNotification={setToastNotification}
          />
        )}
      </div>
      <div className="mobile-warning hidden-desktop">
        <h2>
          Send email sample app is currently designed for a desktop experience.
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
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  setToastNotification: PropTypes.func.isRequired,
};

export default EmailApp;
