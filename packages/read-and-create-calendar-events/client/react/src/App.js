import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import { styles } from './styles';
import {
  applyTimezone,
  currentTime,
  currentTimePlusHalfHour,
  displayMeetingTime,
  getLocalDateString,
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';

function App() {
  const nylas = useNylas();
  const params = new URLSearchParams(window.location.search);
  const userIdFromURL = params.get('userId') || '';
  const [userId, setUserId] = useState(userIdFromURL);
  const [primaryCalendar, setPrimaryCalendar] = useState(null);

  const serverBaseUrl = 'http://localhost:9000';

  useEffect(() => {
    if (!nylas) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      nylas
        .exchangeCodeFromUrlForToken()
        .then((user) => {
          const { id } = JSON.parse(user);
          setUserId(id);
        })
        .catch((err) => {
          console.error('An error occurred parsing the response:', err);
        });
    }
  }, [nylas]);

  useEffect(() => {
    if (userId.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

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
    if(userId) {
      getCalendars();
      // setTimeout(getCalendars, 2000);
    }
  }, [userId]);

  return (
    <div
      style={{
        padding: '6em 1em',
      }}
    >
      {!userId ? (
        <NylasLogin />
      ) : (
        <>
          <section style={styles.App.statusBar}>
            <p style={styles.App.statusBarText}>✨ Connected to Nylas!</p>
          </section>
          <section style={styles.App.contentContainer}>
            <div style={styles.App.agendaContainer}>
              <h2 style={styles.App.agendaHeader}>
                Agenda for {primaryCalendar?.name}
              </h2>
              <Agenda
                serverBaseUrl={serverBaseUrl}
                userId={userId}
                calendarId={primaryCalendar?.id}
              />
            </div>
            <div style={styles.CreateEventForm.container}>
              <h2 style={styles.CreateEventForm.title}>Create event</h2>
              <CreateEventForm
                userId={userId}
                serverBaseUrl={serverBaseUrl}
                calendarId={primaryCalendar?.id}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function NylasLogin() {
  const nylas = useNylas();

  const [email, setEmail] = useState('');

  return (
    <section style={{ width: '80vw', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>
        Read and send calendar events sample app
      </h1>
      <p>Authenticate your email to read</p>
      <div style={{ marginTop: '30px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            nylas.authWithRedirect({
              emailAddress: email,
              successRedirectUrl: '',
            });
          }}
        >
          <input
            required
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Connect</button>
        </form>
      </div>
    </section>
  );
}

function Agenda({ serverBaseUrl, userId, calendarId }) {
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
      {calendarEvents.map((calendarEvent) => (
        <article key={calendarEvent.title} style={styles.Agenda.eventArticle}>
          <div style={styles.Agenda.eventDateContainer}>
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
    </section>
  );
}

function CalendarEventDate({ when }) {
  if (when.object === 'date') {
    return (
      <p style={styles.CalendarEventDate.text}>
        Date: {new Date(when.date).toLocaleDateString()}
      </p>
    );
  }

  if (when.object === 'timespan') {
    return (
      <>
        <p style={styles.CalendarEventDate.text}>
          Start Time: {displayMeetingTime(when.start_time)}
        </p>
        <p style={styles.CalendarEventDate.text}>
          End Time: {displayMeetingTime(when.end_time)}
        </p>
      </>
    );
  }

  return null;
}

function CreateEventForm({ userId, serverBaseUrl, calendarId }) {
  const [startTime, setStartTime] = useState(currentTime());
  const [endTime, setEndTime] = useState(currentTimePlusHalfHour());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const now = new Date();

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const url = serverBaseUrl + '/nylas/create-events';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: applyTimezone(startTime),
          endTime: applyTimezone(endTime),
          title,
          description,
          calendarId,
        }),
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const data = await res.json();

      console.log('Event created:', data);

      // reset form fields
      setStartTime(getLocalDateString(new Date()));
      setEndTime(getLocalDateString(new Date()));
      setTitle('');
      setDescription('');
    } catch (err) {
      console.warn(`Error creating event:`, err);
    }
  };

  return (
    <form style={styles.CreateEventForm.form} onSubmit={createEvent}>
      <label style={styles.CreateEventForm.label} htmlFor="event-start-time">
        Choose a start time:
      </label>
      <input
        style={styles.CreateEventForm.input}
        type="datetime-local"
        name="event-start-time"
        onChange={(event) => {
          setStartTime(event.target.value);
        }}
        value={startTime}
        min={getLocalDateString(now)}
      />
      <label style={styles.CreateEventForm.label} htmlFor="event-end-time">
        Choose an end time:
      </label>
      <input
        style={styles.CreateEventForm.input}
        type="datetime-local"
        name="event-end-time"
        onChange={(event) => {
          setEndTime(event.target.value);
        }}
        value={endTime}
        min={getLocalDateString(now)}
      />
      <label style={styles.CreateEventForm.label} htmlFor="title">
        Title:
      </label>
      <input
        style={styles.CreateEventForm.input}
        type="text"
        name="title"
        onChange={(event) => {
          setTitle(event.target.value);
        }}
        value={title}
      />
      <label style={styles.CreateEventForm.label} htmlFor="description">
        Description:
      </label>
      <textarea
        style={styles.CreateEventForm.input}
        type="text"
        name="description"
        onChange={(event) => {
          setDescription(event.target.value);
        }}
        value={description}
        rows={10}
        width="100%"
      />
      <button style={styles.CreateEventForm.button} type="submit">
        Create Event
      </button>
    </form>
  );
}

export default App;
