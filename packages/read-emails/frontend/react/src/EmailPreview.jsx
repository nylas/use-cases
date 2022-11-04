import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function EmailPreview({ thread }) {
  const [emailFrom, setEmailFrom] = useState('Unknown');

  useEffect(() => {
    if (thread?.from?.[0]?.name) {
      setEmailFrom(thread?.from?.[0]?.name);
    } else {
      setEmailFrom('Unknown');
    }
  }, [thread]);

  return (
    <li className="email-preview-container">
      <div className="email-content">
        <p className="sender">{emailFrom}</p>
        <div className="subject-container">
          <p className="subject">{thread.subject}</p>
        </div>
        <p className="snippet">{thread.snippet}</p>
      </div>
      <div className="email-info">
        <div className="time">
          {new Date(Math.floor(thread.date * 1000)).toDateString()}
        </div>
      </div>
    </li>
  );
}

EmailPreview.propTypes = {
  thread: PropTypes.object.isRequired,
};

export default EmailPreview;
