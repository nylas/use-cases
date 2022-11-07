import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import './styles/email.scss';

function EmailApp({ serverBaseUrl, userId, userEmail }) {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    const getEmails = async () => {
      try {
        const url = serverBaseUrl + '/nylas/read-emails';
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: userId,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();

        setEmails(data);
      } catch (e) {
        console.warn(`Error retrieving emails:`, e);
        return false;
      }
    };

    getEmails();
  }, [serverBaseUrl, userId]);

  return (
    <>
      <div className="email-app">
        <EmailList emails={emails} setSelectedEmail={setSelectedEmail} />
        <EmailDetail selectedEmail={selectedEmail} userEmail={userEmail} />
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
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  userEmail: PropTypes.string.isRequired,
};

export default EmailApp;
