import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import NylasLogin from './NylasLogin';
import Layout from './components/Layout';
import Email from './Email';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');
  const SERVER_URI = import.meta.env.VITE_SERVER_URI || 'http://localhost:9000';

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
          sessionStorage.setItem('userId', id);
        })
        .catch((error) => {
          console.error('An error occurred parsing the response:', error);
        });
    }
  }, [nylas]);

  useEffect(() => {
    if (userId?.length) {
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
          <Email serverBaseUrl={SERVER_URI} userId={userId} />
        </div>
      )}
    </Layout>
  );
}

export default App;
