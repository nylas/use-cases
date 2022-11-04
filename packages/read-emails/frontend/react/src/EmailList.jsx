import React from 'react';
import PropTypes from 'prop-types';
import EmailPreview from './EmailPreview';

function EmailList({ emails, setSelectedEmail }) {
  const handleEmailSelect = (thread) => {
    setSelectedEmail(thread);
  };

  return (
    <div className="email-list-view">
      <section>
        <p className="title">Recent emails</p>
      </section>
      <section className="email-list-container">
        {emails.length === 0 ? (
          <p>Loading emails.</p>
        ) : (
          <ul className="email-list">
            {emails.map((thread) => (
              <div key={thread.id} onClick={() => handleEmailSelect(thread)}>
                <EmailPreview thread={thread} />
              </div>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

EmailList.propTypes = {
  emails: PropTypes.array.isRequired,
  setSelectedEmail: PropTypes.func,
};

export default EmailList;
