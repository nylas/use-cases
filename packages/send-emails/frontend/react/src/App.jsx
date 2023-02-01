import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import NylasLogin from './NylasLogin';
import Layout from './components/Layout';
import EmailApp from './EmailApp';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState([]);
  const [toastNotification, setToastNotification] = useState('');
  const SERVER_URI = import.meta.env.VITE_SERVER_URI || 'http://localhost:9000';

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
    const userIdString = sessionStorage.getItem('userId');
    const userEmail = sessionStorage.getItem('userEmail');
    if (userIdString) {
      setUserId(userIdString);
    }
    if (userEmail) {
      setUserEmail(userEmail);
    }
  }, []);

  useEffect(() => {
    if (userId?.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
      getEmails();
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

  const getEmails = async () => {
    setIsLoading(true);
    setEmails([]);
    setIsLoading(false);
  };

  const disconnectUser = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    setUserId('');
    setUserEmail('');
  };

  return (
    <Layout
      showMenu={!!userId}
      disconnectUser={disconnectUser}
      isLoading={isLoading}
      title="Send email sample app"
      toastNotification={toastNotification}
      setToastNotification={setToastNotification}
    >
      {!userId ? (
        <NylasLogin email={userEmail} setEmail={setUserEmail} />
      ) : (
        <div className="app-card">
          <EmailApp
            userEmail={userEmail}
            emails={emails}
            isLoading={isLoading}
            serverBaseUrl={SERVER_URI}
            userId={userId}
            setToastNotification={setToastNotification}
          />
        </div>
      )}
    </Layout>
  );
}

export default App;
