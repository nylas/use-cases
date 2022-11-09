import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './styles/calendar.scss';
import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import EventPreview from './EventPreview';
import { initializeScrollShadow, handleScrollShadows } from './utils/calendar';

function EventList({
  serverBaseUrl,
  userId,
  calendarId,
  setSelectedEvent,
  selectedEvent,
  isLoading,
  setIsLoading,
}) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showTopScrollShadow, setShowTopScrollShadow] = useState(false);
  const [showBottomScrollShadow, setShowBottomScrollShadow] = useState(false);

  // let loading = true;
  console.log(isLoading);

  useEffect(() => {
    setIsLoading(true);
    const getCalendarEvents = async () => {
      if (calendarId) {
        // loading = true;

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

          // loading = false;
          setIsLoading(false);
        } catch (err) {
          console.warn(`Error reading calendar events:`, err);
        }
      }
    };

    getCalendarEvents();
  }, [serverBaseUrl, userId, calendarId]);

  useEffect(() => {
    initializeScrollShadow('.event-list-container', setShowBottomScrollShadow);
  }, [calendarEvents]);

  useEffect(() => {
    window.addEventListener('resize', () =>
      initializeScrollShadow('.event-list-container', setShowBottomScrollShadow)
    );
  }, []);

  const handleEventSelect = (calendarEvent) => {
    setSelectedEvent(calendarEvent);
  };

  return (
    <section
      className="event-list-container scrollbar"
      onScroll={(event) =>
        handleScrollShadows(
          event,
          setShowTopScrollShadow,
          setShowBottomScrollShadow
        )
      }
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
  );
}

EventList.propTypes = {
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  calendarId: PropTypes.string,
  setSelectedEvent: PropTypes.func,
  selectedEvent: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  setIsLoading: PropTypes.func.isRequired,
};

export default EventList;
