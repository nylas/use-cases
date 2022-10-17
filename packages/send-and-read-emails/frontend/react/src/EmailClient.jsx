import ReadEmails from './ReadEmails';
import SendEmails from './SendEmails';
import { styles } from './styles';

function EmailClient({ userId }) {
  return (
    <>
      <section style={styles.EmailClient.statusBar}>
        <p style={styles.EmailClient.statusBarText}>✨ Connected to Nylas!</p>
      </section>
      <section style={styles.EmailClient.contentContainer}>
        <ReadEmails userId={userId} />
        <SendEmails userId={userId} />
      </section>
    </>
  );
}

export default EmailClient;
