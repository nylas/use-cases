import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import CalendarApp from './CalendarApp';
import NylasLogin from './NylasLogin';
import Layout from './components/Layout';

import {
  getSevenDaysFromTodayDateTimestamp,
  getTodaysDateTimestamp,
} from './utils/date';

function App() {
  const nylas = useNylas();
  const [primaryCalendar, setPrimaryCalendar] = useState(null);
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const serverBaseUrl =
    import.meta.env.VITE_SERVER_URI || 'http://localhost:9000';

  useEffect(() => {
    const userIdString = sessionStorage.getItem('userId');
    if (userIdString) {
      setUserId(userIdString);
    }
  }, []);

  useEffect(() => {
    if (!nylas) {
      return;
    }

    // Handle the code that is passed in the query params from Nylas after a successful login
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
    if (params.has('userId')) {
      setUserId(params.get('userId'));
    }
  }, [nylas]);

  useEffect(() => {
    if (userId?.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
      getPrimaryCalendarEvents();
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

  const getPrimaryCalendar = async () => {
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
      return calendar;
    } catch (err) {
      console.warn(`Error reading calendars:`, err);
    }
  };

  const getCalendarEvents = async (calendarId) => {
    // console.log(calendarId);
    // alert('in getCalendarEvents');
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

        setEvents(data);

        // loading = false;
        setIsLoading(false);
      } catch (err) {
        console.warn(`Error reading calendar events:`, err);
      }
    }
  };

  const getPrimaryCalendarEvents = async () => {
    setIsLoading(true);
    const primaryCalendar = await getPrimaryCalendar();
    getCalendarEvents(primaryCalendar?.id);
    setIsLoading(false);
  };

  const disconnectUser = () => {
    sessionStorage.removeItem('userId');
    setUserId('');
  };

  const refresh = () => {
    getPrimaryCalendarEvents();
  };

  return (
    <Layout
      showMenu={!!userId}
      disconnectUser={disconnectUser}
      isLoading={isLoading}
      refresh={refresh}
    >
      {!userId ? (
        <NylasLogin />
      ) : (
        <div className="app-card">
          <CalendarApp
            userId={userId}
            calendarId={primaryCalendar}
            serverBaseUrl={serverBaseUrl}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            events={events}
          />
        </div>
      )}
    </Layout>
  );
}

export default App;
