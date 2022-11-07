import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import CalendarClient from './CalendarClient2';
import NylasLogin from './NylasLogin';
import Layout from './components/Layout';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');

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
    if (userId.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

  const disconnectUser = () => {
    sessionStorage.removeItem('userId');
    setUserId('');
  };

  return (
    <Layout showMenu={!!userId} disconnectUser={disconnectUser}>
      {!userId ? (
        <NylasLogin />
      ) : (
        <div className="app-card">
          <CalendarClient userId={userId} />
        </div>
      )}
    </Layout>
  );
}

export default App;
