import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './styles/calendar.scss';
import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import EventPreview from './EventPreview';

function EventList({ serverBaseUrl, userId, calendarId, primaryCalendar }) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showTopScrollShadow, setShowTopScrollShadow] = useState(false);
  const [showBottomScrollShadow, setShowBottomScrollShadow] = useState(false);

  let loading = true;

  useEffect(() => {
    const getCalendarEvents = async () => {
      if (calendarId) {
        // setLoading(true);
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

          console.log('Calendar events:', data);

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
    const scrollElement = document.querySelector('.event-list-container');
    const isScrollable =
      scrollElement.scrollHeight !== scrollElement.clientHeight;

    setShowBottomScrollShadow(isScrollable);
  }, [calendarEvents]);

  const handleEventSelect = (calendarEvent) => {
    alert(calendarEvent + ' selected!');
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
        {showTopScrollShadow && <div className="top-scroll-shadow"></div>}
        {calendarEvents.length === 0 ? (
          <p>{loading ? 'Loading events.' : 'No events scheduled.'}</p>
        ) : (
          <ul className="event-list">
            {calendarEvents.map((calendarEvent) => (
              <div
                key={calendarEvent.id}
                onClick={() => handleEventSelect(calendarEvent.id)}
              >
                <EventPreview calendarEvent={calendarEvent} />
              </div>
            ))}
          </ul>
        )}
        {showBottomScrollShadow && <div className="bottom-scroll-shadow"></div>}
      </section>
    </div>
  );
}

//   {/* <section style={styles.Agenda.container}> */}
//   {/* <h2 style={styles.Agenda.header}>Agenda for {primaryCalendar?.name}</h2> */}

//   {/* <div> */}
//     {/* <div style={styles.Agenda.eventsContainer}> */}
//     {calendarEvents.map((calendarEvent) => (
//       <article key={calendarEvent.title}>
//         {/* <article key={calendarEvent.title} style={styles.Agenda.event}> */}
//         <div>
//           {/* <div style={styles.Agenda.eventDate}> */}
//           {/* <CalendarEventDate when={calendarEvent.when} /> */}
//           <p>test</p>
//         </div>
//         {/* <h2 style={styles.Agenda.eventTitle}>{calendarEvent.title}</h2>
//       <div
//         style={styles.Agenda.eventContent}
//         dangerouslySetInnerHTML={{
//           __html: calendarEvent.description,
//         }}
//       /> */}
//       {/* </article> */}
//     {/* // ))} */}
//   {/* </div> */}
// {/* </section> */}

EventList.propTypes = {
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  calendarId: PropTypes.string.isRequired,
  primaryCalendar: PropTypes.object.isRequired,
};

export default EventList;
