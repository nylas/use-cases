import { useEffect, useState } from 'react';
import Agenda from './Agenda';
import CreateEventForm from './CreateEventForm';
import { styles } from './styles';

function CalendarClient({ userId }) {
  const [primaryCalendar, setPrimaryCalendar] = useState(null);
  const serverBaseUrl =
    import.meta.env.VITE_SERVER_URI || 'http://localhost:9000';

  useEffect(() => {
    const getCalendars = async () => {
      try {
        const url = serverBaseUrl + '/nylas/read-calendars';

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: userId,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(res.statusText);
        }

        const data = await res.json();

        let [calendar] = data.filter((calendar) => calendar.is_primary);
        // if no primary calendar, use the first one
        if (!calendar && data.length) {
          calendar = data[0];
        }

        setPrimaryCalendar(calendar);
      } catch (err) {
        console.warn(`Error reading calendars:`, err);
      }
    };

    if (userId) {
      getCalendars();
    }
  }, [userId, serverBaseUrl]);

  return (
    <>
      <section style={styles.CalendarClient.statusBar}>
        <p style={styles.CalendarClient.statusBarText}>
          ✨ Connected to Nylas!
        </p>
      </section>
      <section style={styles.CalendarClient.contentContainer}>
        <Agenda
          primaryCalendar={primaryCalendar}
          serverBaseUrl={serverBaseUrl}
          userId={userId}
          calendarId={primaryCalendar?.id}
        />
        <CreateEventForm
          userId={userId}
          serverBaseUrl={serverBaseUrl}
          calendarId={primaryCalendar?.id}
        />
      </section>
    </>
  );
}

export default CalendarClient;
