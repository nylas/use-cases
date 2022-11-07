import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './styles/calendar.scss';
// import { styles } from './styles';
import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import EventPreview from './EventPreview';

function EventList({ serverBaseUrl, userId, calendarId, primaryCalendar }) {
  const [calendarEvents, setCalendarEvents] = useState([]);

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

          console.log('Calendar events:', data);

          setCalendarEvents(data);
        } catch (err) {
          console.warn(`Error reading calendar events:`, err);
        }
        loading = false;
      }
    };

    getCalendarEvents();
  }, [serverBaseUrl, userId, calendarId]);

  console.log({ primaryCalendar }); // TODO: delete

  const handleEventSelect = (calendarEvent) => {
    alert(calendarEvent + ' selected!');
  };

  return (
    <div className="event-list-view">
      <section>
        <p className="title">Upcoming events</p>
      </section>
      <section className="event-list-container">
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
