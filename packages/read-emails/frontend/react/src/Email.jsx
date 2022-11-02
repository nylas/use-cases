import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import EmailList from './EmailList';
import './styles/email.scss';

function Email({ serverBaseUrl, userId }) {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');

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
    <div className="email-app">
      <EmailList emails={emails} setSelectedEmail={setSelectedEmail} />
      <div className="email-detail-view">
        <h3>Email Details</h3>
        <span>{selectedEmail.subject}</span>
      </div>
    </div>
  );
}

Email.propTypes = {
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default Email;
