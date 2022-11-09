import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './styles/calendar.scss';
import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import EventPreview from './EventPreview';
import {
  showTopScrollShadow,
  showBottomScrollShadow,
  initializeScrollShadow,
  handleScrollShadows,
} from './utils/calendar';

function EventList({
  serverBaseUrl,
  userId,
  calendarId,
  setSelectedEvent,
  selectedEvent,
}) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  // const [selectedEvent, setSelectedEvent] = useState({});
  // const [showTopScrollShadow, setShowTopScrollShadow] = useState(false);
  // const [showBottomScrollShadow, setShowBottomScrollShadow] = useState(false);

  let loading = true;

  useEffect(() => {
    const getCalendarEvents = async () => {
      if (calendarId) {
        loading = true;

        try {
          const startsAfter = getTodaysDateTimestamp(); // today
          const endsBefore = getSevenDaysFromTodayDateTimestamp(); // 7 days from today

          const queryParams = new URLSearchParams({
            limit: 5,
            startsAfter,
            endsBefore,
            calendarId,
          });

          const url = `${serverBaseUrl}/nylas/read-events?${queryParams.toString()}`;

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: userId,
              'Content-Type': 'application/json',
            },
            params: {
              calendarId,
            },
          });

          if (!res.ok) {
            throw new Error(res.statusText);
          }

          const data = await res.json();

          setCalendarEvents(data);

          loading = false;
        } catch (err) {
          console.warn(`Error reading calendar events:`, err);
        }
      }
    };

    getCalendarEvents();
  }, [serverBaseUrl, userId, calendarId]);

  useEffect(() => {
    initializeScrollShadow('.event-list-container');
  }, [calendarEvents]);

  useEffect(() => {
    window.addEventListener('resize', () =>
      initializeScrollShadow('.event-list-container')
    );
  }, []);

  const handleEventSelect = (calendarEvent) => {
    setSelectedEvent(calendarEvent);
  };

  return (
    <div className="event-list-view">
      <section className="event-header">
        <p className="title">Upcoming events</p>
      </section>
      <section
        className="event-list-container scrollbar"
        onScroll={handleScrollShadows}
      >
        <div
          className={`scroll-shadow top${showTopScrollShadow ? '' : ' hidden'}`}
        ></div>
        {calendarEvents.length === 0 ? (
          <p>{loading ? 'Loading events.' : 'No events scheduled.'}</p>
        ) : (
          <ul className="event-list">
            {calendarEvents.map((calendarEvent) => (
              <div
                key={calendarEvent.id}
                onClick={() => handleEventSelect(calendarEvent)}
              >
                <EventPreview
                  calendarEvent={calendarEvent}
                  selectedEvent={selectedEvent}
                />
              </div>
            ))}
          </ul>
        )}
        <div
          className={`scroll-shadow bottom${
            showBottomScrollShadow ? '' : ' hidden'
          }`}
        ></div>
      </section>
    </div>
  );
}

EventList.propTypes = {
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  calendarId: PropTypes.string,
  setSelectedEvent: PropTypes.func,
  selectedEvent: PropTypes.object,
};

export default EventList;
