// import { styles } from './styles';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { displayMeetingTime } from './utils/date';

function EventPreview({ calendarEvent }) {
  return (
    <li className="event-preview-container">
      <div className="event-content">
        <div className="date">
          <div className="day">18</div>
          <div className="month">Aug</div>
        </div>
        <div className="summary">
          <div className="title">Dashboard 3.0 Sync</div>
          {/* TODO: Handle all day events */}
          <div className="time">8:00 - 9:00 am</div>
        </div>
        {/* <p className="snippet">Dashboard 3.0 Sync</p> */}
        {/* <div className="event-info">
        <div className="time">8:00 - 9:00 am</div>
      </div> */}
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
