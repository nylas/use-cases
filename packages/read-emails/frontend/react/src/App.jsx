import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import EmailList from './EmailList';
import Layout from './components/Layout';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');
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
        })
        .catch((error) => {
          console.error('An error occurred parsing the response:', error);
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

  return !userId ? (
    <NylasLogin />
  ) : (
    <EmailList serverBaseUrl={SERVER_URI} userId={userId} />
  );
}

function NylasLogin() {
  const nylas = useNylas();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginUser = (e) => {
    e.preventDefault();
    setIsLoading(true);

    nylas.authWithRedirect({
      emailAddress: email,
      successRedirectUrl: '',
    });
  };

  return (
    <>
      <Layout>
        <section className="login">
          <form onSubmit={loginUser}>
            <input
              required
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect email'}
            </button>
          </form>
        </section>
      </Layout>
    </>
  );
}

export default App;
