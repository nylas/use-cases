import { useNylas } from '@nylas/nylas-react';
import { useState } from 'react';
import { styles } from './styles';

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
export default SendEmails;
