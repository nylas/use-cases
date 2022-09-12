import { useNylas } from '@nylas/nylas-react';
import { useState } from 'react';
import DisplayEmail from './DisplayEmail';
import { styles } from './styles';

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
          <DisplayEmail
            key={thread.id}
            subject={thread.subject}
            snippet={thread.snippet}
          />
        ))}
      </div>
    </div>
  );
}

export default ReadEmails;
