import { useEffect, useState } from 'react';
import Email from './Email';
import { styles } from './styles';

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

        setEmails(data);
      } catch (e) {
        console.warn(`Error retrieving emails:`, e);
        return false;
      }
    };

    getEmails();
  }, [serverBaseUrl, userId, emails]);

  return (
    <>
      <section style={styles.EmailList.statusBar}>
        <p style={styles.EmailList.statusBarText}>✨ Connected to Nylas!</p>
      </section>
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
    </>
  );
}

export default EmailList;
