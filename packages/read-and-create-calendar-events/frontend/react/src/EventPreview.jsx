// import { styles } from './styles';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { displayMeetingTime } from './utils/date';

function EventPreview({ calendarEvent }) {
  return (
    <li className="event-preview-container">
      <div className="event-content">
        <p className="sender">sender</p>
        <div className="subject-container">
          <p className="subject">subject</p>
        </div>
        <p className="snippet">snippet</p>
      </div>
      <div className="event-info">
        <div className="time">12:00 AM</div>
      </div>
    </li>
  );
  // if (when.object === 'date') {
  //   return (
  //     <p style={styles.CalendarEventDate.text}>
  //       Date: {new Date(when.date).toLocaleDateString()}
  //     </p>
  //   );
  // }

  // if (when.object === 'timespan') {
  //   return (
  //     <>
  //       <p style={styles.CalendarEventDate.text}>
  //         Start Time: {displayMeetingTime(when.start_time)}
  //       </p>
  //       <p style={styles.CalendarEventDate.text}>
  //         End Time: {displayMeetingTime(when.end_time)}
  //       </p>
  //     </>
  //   );
  // }

  // return null;
}

EventPreview.PropTypes = {
  calendarEvent: PropTypes.object.isRequired,
};

export default EventPreview;
