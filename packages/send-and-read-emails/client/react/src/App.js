import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import EmailClient from './EmailClient';

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
  }, [nylas]);

  useEffect(() => {
    if (userId.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

  return userId ? <EmailClient userId={userId} /> : <NylasLogin />;
}

function NylasLogin() {
  const nylas = useNylas();

  const [email, setEmail] = useState('');

  return (
    <section style={{ width: '80vw', margin: '0 auto' }}>
      <h1>Send and read emails sample app</h1>
      <p>Authenticate your email to send and read</p>
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

export default App;
