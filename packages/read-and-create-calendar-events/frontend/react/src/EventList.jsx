import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './styles/calendar.scss';
import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import EventPreview from './EventPreview';

function EventList({
  serverBaseUrl,
  userId,
  calendarId,
  setSelectedEvent,
  selectedEvent,
}) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  // const [selectedEvent, setSelectedEvent] = useState({});
  const [showTopScrollShadow, setShowTopScrollShadow] = useState(false);
  const [showBottomScrollShadow, setShowBottomScrollShadow] = useState(false);

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

  const initializeScrollShadow = () => {
    const scrollElement = document.querySelector('.event-list-container');
    const isScrollable =
      scrollElement.scrollHeight !== scrollElement.clientHeight;

    setShowBottomScrollShadow(isScrollable);
  };

  useEffect(() => {
    initializeScrollShadow();
  }, [calendarEvents]);

  useEffect(() => {
    window.addEventListener('resize', initializeScrollShadow);
  }, []);

  const handleEventSelect = (calendarEvent) => {
    setSelectedEvent(calendarEvent);
  };

  const handleScrollShadows = (event) => {
    const element = event.target;

    const atTop = element.scrollTop < 12;
    const atBottom =
      element.clientHeight + element.scrollTop + 12 > element.scrollHeight;

    setShowTopScrollShadow(!atTop);
    setShowBottomScrollShadow(!atBottom);
  };

  return (
    <div className="event-list-view">
      <section className="event-header">
        <p className="title">Upcoming events</p>
      </section>
      <section className="event-list-container" onScroll={handleScrollShadows}>
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
        {/* {showBottomScrollShadow && <div className="scroll-shadow"></div>} */}
      </section>
    </div>
  );
}

EventList.propTypes = {
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  calendarId: PropTypes.string.isRequired,
  setSelectedEvent: PropTypes.func,
  selectedEvent: PropTypes.object,
};

export default EventList;
