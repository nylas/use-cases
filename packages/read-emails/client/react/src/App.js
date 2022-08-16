import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import { styles } from './styles';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');

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
          <section style={styles.App.contentContainer}></section>
          <EmailList serverBaseUrl={'http://localhost:9000'} userId={userId} />
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
      <h1>Read emails sample app</h1>
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

function EmailList({ serverBaseUrl, userId }) {
  const [emails, setEmails] = useState([]);
  const [openEmail, setOpenEmail] = useState('');

  useEffect(() => {
    const getEmails = async () => {
      try {
        const url = serverBaseUrl + '/nylas/read-emails';
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: userId,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();

        console.log(data);
        setEmails(data);
      } catch (e) {
        console.warn(`Error retrieving emails:`, e);
        return false;
      }
    };

    getEmails();
  }, [serverBaseUrl, userId, emails]);

  return (
    <section style={styles.EmailList.container}>
      {emails.length === 0 ? (
        <p>Loading emails.</p>
      ) : (
        <ul style={styles.EmailList.list}>
          {emails.map((thread) => (
            <Email
              key={thread.id}
              isOpen={openEmail === thread.id}
              thread={thread}
              setOpenEmail={setOpenEmail}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function Email({ thread, isOpen, setOpenEmail }) {
  return (
    <li
      key={thread.id}
      onClick={() => (isOpen ? setOpenEmail('') : setOpenEmail(thread.id))}
      style={styles.Email.container}
    >
      <div>{thread.subject}</div>
      <div style={styles.Email.date}>
        {new Date(Math.floor(thread.date * 1000)).toDateString()}
      </div>
      <div style={styles.Email.snippet}>{thread.snippet}</div>
      {isOpen && (
        <pre style={styles.Email.thread}>
          <code>{JSON.stringify(thread, null, 4)}</code>
        </pre>
      )}
    </li>
  );
}

export default App;
