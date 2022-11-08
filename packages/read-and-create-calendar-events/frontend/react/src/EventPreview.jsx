// import { styles } from './styles';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { displayMeetingTime, getEventDate } from './utils/date';

function EventPreview({ calendarEvent, selectedEvent }) {
  const eventDate = getEventDate(calendarEvent);
  const isActiveEvent = calendarEvent.id === selectedEvent?.id;

  return (
    <li className={`event-preview-container${isActiveEvent ? ' active' : ''}`}>
      <div className="event-content">
        <div className="date">
          <div className="day">{eventDate.getDate()}</div>
          <div className="month">
            {eventDate.toLocaleString('en-US', { month: 'short' })}
          </div>
        </div>
        <div className="summary">
          <div className="title">{calendarEvent.title}</div>
          <div className="time">
            {calendarEvent.when.object === 'date'
              ? 'all day'
              : displayMeetingTime(calendarEvent.when)}
          </div>
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

EventPreview.propTypes = {
  calendarEvent: PropTypes.object.isRequired,
  selectedEvent: PropTypes.object.isRequired,
};

export default EventPreview;
