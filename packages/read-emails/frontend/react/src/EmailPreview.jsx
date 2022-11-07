import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatPreviewDate } from './utils/date.js';
import AttachmentIcon from './components/icons/icon-attachment.svg';
import CalendarIcon from './components/icons/icon-calendar.svg';

function EmailPreview({ thread }) {
  const [emailFrom, setEmailFrom] = useState('Unknown');
  const [hasAttachment, setHasAttachment] = useState(false);
  const [hasCalendar, setHasCalendar] = useState(false);

  useEffect(() => {
    if (thread?.from?.[0]?.name) {
      setEmailFrom(thread?.from?.[0]?.name);
    } else {
      setEmailFrom('Unknown');
    }

    if (thread?.files?.length) {
      setHasAttachment(
        thread.files.some(
          (file) =>
            file.content_disposition === 'attachment' &&
            !file.content_type.includes('calendar') &&
            !file.content_type.includes('ics')
        )
      );
      setHasCalendar(
        thread.files.some(
          (file) =>
            file.content_type.includes('calendar') ||
            file.content_type.includes('ics')
        )
      );
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
        {hasCalendar && (
          <img src={CalendarIcon} alt="calendar icon" width="20" />
        )}
        {hasAttachment && (
          <img src={AttachmentIcon} alt="attachment icon" width="20" />
        )}
        <div className="time">
          {formatPreviewDate(new Date(Math.floor(thread.date * 1000)))}
        </div>
      </div>
    </li>
  );
}

EmailPreview.propTypes = {
  thread: PropTypes.object.isRequired,
};

export default EmailPreview;
