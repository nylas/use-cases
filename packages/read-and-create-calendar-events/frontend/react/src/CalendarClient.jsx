import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import EventList from './EventList';
import EventDetail from './EventDetail';
import CreateEventForm from './CreateEventForm';
import './styles/calendar.scss';

function CalendarClient({ userId }) {
  const [primaryCalendar, setPrimaryCalendar] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
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
      <div className="calendar-app">
        <>
          <div className="event-list-view">
            <section className="event-header">
              <p className="title">Upcoming events</p>
              <p
                className={`create-event${showCreateEventForm ? ' hide' : ''}`}
                onClick={() => setShowCreateEventForm(true)}
              >
                Create event
              </p>
            </section>
            <EventList
              primaryCalendar={primaryCalendar}
              serverBaseUrl={serverBaseUrl}
              userId={userId}
              calendarId={primaryCalendar?.id}
              setSelectedEvent={setSelectedEvent}
              selectedEvent={selectedEvent}
            />
          </div>
          {showCreateEventForm ? (
            <CreateEventForm />
          ) : (
            <EventDetail selectedEvent={selectedEvent} />
          )}
        </>
      </div>
      <div className="mobile-warning hidden-desktop">
        <h2>
          Calendar sample app is currently designed for a desktop experience.
        </h2>
        <p>
          Visit Nylas dashboard for more use-cases: https://dashboard.nylas.com
        </p>
      </div>
    </>
  );
}

CalendarClient.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default CalendarClient;
