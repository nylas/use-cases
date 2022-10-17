import { styles } from './styles';

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

export default Email;
