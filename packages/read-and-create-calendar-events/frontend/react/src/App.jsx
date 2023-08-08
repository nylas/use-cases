import React, { useEffect, useState } from 'react';
import CalendarApp from './CalendarApp';
import NylasLogin from './NylasLogin';
import Layout from './components/Layout';

import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';
import AppContext from './contexts/AppContext';

function App() {
  const app = React.useContext(AppContext);
  const [primaryCalendar, setPrimaryCalendar] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Handle the code that is passed in the query params from Nylas after a successful login
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') && !isExchangingCode) {
      setIsExchangingCode(true);
      app.api
        .exchangeCodeForGrantId(params.get('code'))
        .then((grantId) => {
          app.setGrantId(grantId);
          window.history.replaceState({}, '', `/?grantId=${grantId}`);
        })
        .catch((error) => {
          console.error('An error occurred parsing the response:', error);
          window.history.replaceState({}, '', `/`);
        })
        .finally(() => {
          setIsExchangingCode(false);
        });
    }

    // If we have a grantId in the query params, set it in the app context
    if (params.has('grantId')) {
      app.setGrantId(params.get('grantId'));
    }
  }, [isExchangingCode, app]);

  useEffect(() => {
    if (app.grantId) {
      getPrimaryCalendarEvents();
    }
  }, [app.grantId]);

  const getPrimaryCalendar = async () => {
    try {
      const calendars = await app.api.getCalendars(app.grantId);

      let [calendar] = calendars.filter((calendar) => calendar.is_primary);
      // if no primary calendar, use the first one
      if (!calendar && calendars.length) {
        calendar = calendars[0];
      }

      setPrimaryCalendar(calendar);
      return calendar;
    } catch (err) {
      console.warn(`Error reading calendars:`, err);
    }
  };

  const getCalendarEvents = async (calendarId) => {
    if (calendarId) {
      try {
        const startsAfter = getTodaysDateTimestamp(); // today
        const endsBefore = getSevenDaysFromTodayDateTimestamp(); // 7 days from today

        const events = await app.api.getEvents({
          grantId: app.grantId,
          calendarId,
          startsAfter,
          endsBefore,
        });

        const filteredEvents = events.filter(
          (event) => event.status !== 'cancelled'
        );

        setEvents(filteredEvents);
        setIsLoading(false);
      } catch (err) {
        console.warn(`Error reading calendar events:`, err);
      }
    }
  };

  const getPrimaryCalendarEvents = async () => {
    setIsLoading(true);
    const primaryCalendar = await getPrimaryCalendar();
    await getCalendarEvents(primaryCalendar?.id);
    setIsLoading(false);
  };

  const disconnectUser = async () => {
    await app.api.deleteGrant(app.grantId);
    app.setGrantId(null);
    window.history.replaceState({}, '', `/`);
  };

  const refresh = () => {
    getPrimaryCalendarEvents();
  };

  return (
    <Layout
      showMenu={!!app.grantId}
      disconnectUser={disconnectUser}
      isLoading={isLoading}
      refresh={refresh}
    >
      <React.Fragment>
        {isExchangingCode && (
          <div className="app-card">
            <p>Exchanging authentication code, please wait...</p>
          </div>
        )}

        {!app.grantId && !isExchangingCode && (
          <NylasLogin email={userEmail} setEmail={setUserEmail} />
        )}

        {app.grantId && !isExchangingCode && (
          <div className="app-card">
            <CalendarApp
              calendarId={primaryCalendar?.id}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              events={events}
              refresh={refresh}
            />
          </div>
        )}
      </React.Fragment>
    </Layout>
  );
}

export default App;
