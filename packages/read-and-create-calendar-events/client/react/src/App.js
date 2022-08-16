import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import { styles } from './styles';
import { applyTimezone, displayMeetingTime, getDateString } from './utils/date';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');
  const [calendarId, setCalendarId] = useState(null);

  const serverBaseUrl = 'http://localhost:9000';
  const handleTokenExchange = (r) => {
    try {
      const user = JSON.parse(r);
      setUserId(user.id);
      window.history.replaceState({}, '', `/?userId=${user.id}`);
    } catch (e) {
      console.error('An error occurred parsing the response.');
      window.history.replaceState({}, '', '/');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      nylas.exchangeCodeFromUrlForToken().then(handleTokenExchange);
    }

    if (params.has('userId')) {
      setUserId(params.get('userId'));
    }
  }, [nylas]);

  const handleCalendarPickerOnChange = (calendarId) => {
    setCalendarId(calendarId);
  };

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
            <div
              style={{
                padding: '1em',
              }}
            >
              <p style={styles.App.statusBarText}>✨ Connected to Nylas!</p>
            </div>
          </section>
          <section style={styles.App.contentContainer}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '70%',
                marginRight: 40,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: '1.6em' }}>Agenda</h2>
                <CalendarPicker
                  serverBaseUrl={serverBaseUrl}
                  userId={userId}
                  selectedCalendarId={calendarId}
                  onChange={handleCalendarPickerOnChange}
                />
              </div>
              <Agenda
                serverBaseUrl={serverBaseUrl}
                userId={userId}
                calendarId={calendarId}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '30%',
              }}
            >
              <h2>Create event</h2>
              <CreateEventForm
                userId={userId}
                serverBaseUrl={serverBaseUrl}
                calendarId={calendarId}
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
      <h1>Read and send calendar events sample app</h1>
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

function CalendarPicker({
  serverBaseUrl,
  userId,
  selectedCalendarId,
  onChange,
}) {
  const [calendars, setCalendars] = useState([]);
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

        const data = await res.json();

        setCalendars(data);
      } catch (err) {
        console.warn(`Error creating event:`, err);
      }
    };

    getCalendars();
  }, [serverBaseUrl, userId]);

  return (
    <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
      <label style={{ marginRight: 8 }} for="calendar">
        Select a Calendar:
      </label>
      <select
        name="calendar"
        value={selectedCalendarId}
        onChange={(e) => onChange(e.target.value)}
      >
        {calendars.map((calendar) => (
          <option key={calendar.id} value={calendar.id}>
            {calendar.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Agenda({ serverBaseUrl, userId, calendarId }) {
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const getCalendarEvents = async () => {
      try {
        const url = `${serverBaseUrl}/nylas/read-events?${
          calendarId ? 'calendarId=' + calendarId : ''
        }`;

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
        const data = await res.json();

        console.log(data);
        setCalendarEvents(data);
      } catch (e) {
        console.warn(`Error retrieving calendarEvents:`, e);
        return false;
      }
    };

    getCalendarEvents();
  }, [serverBaseUrl, userId, calendarId]);

  return (
    <section
      style={{
        maxHeight: '60vh',
        overflowY: 'scroll',
        border: '4px solid rgb(65, 105, 225)',
        borderRadius: 16,
        padding: 12,
      }}
    >
      {calendarEvents.map((calendarEvent) => (
        <article
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 8,
            boxShadow: '0px 4px 8px rgb(115 115 115 / 60%)',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              maxWidth: '50%',
              justifyContent: 'space-between',
            }}
          >
            <CalendarEventDate when={calendarEvent.when} />
          </div>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.6em' }}>
            {calendarEvent.title}
          </h2>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              flexDirection: 'column',
              WebkitLineClamp: 3,
              maxHeight: '120px',
              color: '#737373',
            }}
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
    return <p>Date: {new Date(when.date).toLocaleDateString()}</p>;
  }

  if (when.object === 'timespan') {
    return (
      <>
        <p style={{ margin: '0 0 24px' }}>
          Start Time: {displayMeetingTime(when.start_time)}
        </p>
        <p style={{ margin: '0 0 24px' }}>
          End Time: {displayMeetingTime(when.end_time)}
        </p>
      </>
    );
  }

  return null;
}

function CreateEventForm({ userId, serverBaseUrl, calendarId }) {
  const [startTime, setStartTime] = useState(getDateString(new Date()));
  const [endTime, setEndTime] = useState(getDateString(new Date()));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const now = new Date();

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const url = serverBaseUrl + '/nylas/create-events';
      console.log('startTime:', startTime);

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

      const data = await res.json();

      console.log(data);
    } catch (err) {
      console.warn(`Error creating event:`, err);
    }
  };

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column' }}
      onSubmit={createEvent}
    >
      <label for="event-start-time">Choose a start time:</label>
      <input
        type="datetime-local"
        name="event-start-time"
        onChange={(event) => {
          setStartTime(event.target.value);
        }}
        value={startTime}
        min={getDateString(now)}
      />
      <label for="event-end-time">Choose an end time:</label>
      <input
        type="datetime-local"
        name="event-end-time"
        onChange={(event) => {
          setEndTime(event.target.value);
        }}
        value={endTime}
        min={getDateString(now)}
      />
      <label for="title">Title:</label>
      <input
        type="text"
        name="title"
        onChange={(event) => {
          setTitle(event.target.value);
        }}
        value={title}
      />
      <label for="description">Description:</label>
      <textarea
        type="text"
        name="description"
        onChange={(event) => {
          setDescription(event.target.value);
        }}
        value={description}
        rows={10}
        width="100%"
      />
      <button type="submit">Create Event</button>
    </form>
  );
}

export default App;
