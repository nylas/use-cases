import { useEffect, useState } from 'react';
import { styles } from './styles';
import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import CalendarEventDate from './CalendarEventDate';

function Agenda({ serverBaseUrl, userId, calendarId, primaryCalendar }) {
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const getCalendarEvents = async () => {
      if (calendarId) {
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
      }
    };

    getCalendarEvents();
  }, [serverBaseUrl, userId, calendarId]);

  return (
    <section style={styles.Agenda.container}>
      <h2 style={styles.Agenda.header}>Agenda for {primaryCalendar?.name}</h2>
      <div style={styles.Agenda.eventsContainer}>
        {calendarEvents.map((calendarEvent) => (
          <article key={calendarEvent.title} style={styles.Agenda.event}>
            <div style={styles.Agenda.eventDate}>
              <CalendarEventDate when={calendarEvent.when} />
            </div>
            <h2 style={styles.Agenda.eventTitle}>{calendarEvent.title}</h2>
            <div
              style={styles.Agenda.eventContent}
              dangerouslySetInnerHTML={{
                __html: calendarEvent.description,
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export default Agenda;
