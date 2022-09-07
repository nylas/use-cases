import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import DisplayEmail from './DisplayEmail';
import { styles } from './styles';

function App() {
  const nylas = useNylas();

  const [userId, setUserId] = useState('');

  const handleTokenExchange = (r) => {
    try {
      const { id } = JSON.parse(r);
      setUserId(id);
    } catch (e) {
      console.error('An error occurred parsing the response.');
    }
  };

  useEffect(() => {
    if (!nylas) {
      return;
    }

    // Handle the code that is passed in the query params from Nylas after a successful login
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      nylas.exchangeCodeFromUrlForToken().then(handleTokenExchange);
    }
  }, [nylas]);

  useEffect(() => {
    if (userId.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

  return (
    <>
      <div
        style={{
          padding: '6em 1em',
        }}
      >
        {userId ? (
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
              <ReadEmails userId={userId} />
              <SendEmails userId={userId} />
            </section>
          </>
        ) : (
          <NylasLogin />
        )}
      </div>
    </>
  );
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

function ReadEmails({ userId }) {
  const nylas = useNylas();
  const [threads, setThreads] = useState([]);

  const fetchEmails = async () => {
    if (!userId) {
      return;
    }

    const url = nylas.serverBaseUrl + '/nylas/read-emails';

    const requestHeaders = new Headers();
    requestHeaders.set('Authorization', userId);
    requestHeaders.set('Content-Type', 'application/json');

    const res = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    const data = await res.json();

    setThreads(data.threads);
  };

  return (
    <div style={styles.ReadEmails.container}>
      <button style={styles.ReadEmails.button} onClick={fetchEmails}>
        Get Emails
      </button>
      <div style={styles.ReadEmails.list}>
        {threads.map((thread) => (
          <DisplayEmail subject={thread.subject} snippet={thread.snippet} />
        ))}
      </div>
    </div>
  );
}

function SendEmails({ userId }) {
  const nylas = useNylas();

  const [to, setTo] = useState('');
  const [body, setBody] = useState('');

  const sendEmail = async ({ userId, to, body }) => {
    try {
      const url = nylas.serverBaseUrl + '/nylas/send-email';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, body }),
      });

      const data = await res.json();

      console.log(data);
      return data;
    } catch (e) {
      console.warn(`Error sending emails:`, e);

      return false;
    }
  };

  const send = async () => {
    if (!userId) {
      return;
    }

    const message = await sendEmail({ userId, to, body });
    console.log(message);

    alert('Sent. Check console for confirmation...');

    setTo('');
    setBody('');
  };

  return (
    <div style={styles.SendEmails.container}>
      <div style={styles.SendEmails.header}>New Message</div>
      <input
        style={styles.SendEmails.to}
        placeholder="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <textarea
        style={styles.SendEmails.body}
        rows={30}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div style={styles.SendEmails.cta}>
        <button
          style={styles.SendEmails.button}
          disabled={!to || !body}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
