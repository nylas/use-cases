import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SendEmails from './SendEmails';
import './styles/email.scss';

function EmailApp({ serverBaseUrl, userId, setToastNotification }) {
  // const [selectedEmail, setSelectedEmail] = useState(null);
  const [draftEmail, setDraftEmail] = useState(null);

  useEffect(() => {
    // setSelectedEmail(null);
    composeEmail();
  }, []);

  const composeEmail = () => {
    if (draftEmail) {
      // Open the existing draft email
      setDraftEmail((prev) => ({ ...prev, isOpen: true }));
    } else {
      // Create new draft email
      const currentDate = new Date();
      const newDraft = {
        object: 'draft',
        to: '',
        subject: '',
        body: '',
        last_message_timestamp: Math.floor(currentDate.getTime() / 1000),
        isOpen: true,
      };
      setDraftEmail(newDraft);
    }
    // setSelectedEmail(null);
  };

  const onEmailSent = () => {
    setDraftEmail(null);
    // reloadEmail();
    setToastNotification('success');
  };

  return (
    <>
      <div className="email-app">
        {!draftEmail ? (
          <p className="loading-text">Loading composer...</p>
        ) : (
          <SendEmails
            userId={userId}
            draftEmail={draftEmail}
            setDraftEmail={(draftUpdates) =>
              setDraftEmail((prev) => {
                return {
                  ...prev,
                  ...draftUpdates,
                };
              })
            }
            onEmailSent={onEmailSent}
            setToastNotification={setToastNotification}
            discardComposer={(e) => {
              e.preventDefault();
              alert('TODO');
            }}
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
