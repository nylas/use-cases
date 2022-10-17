import { styles } from './styles';
import { displayMeetingTime } from './utils/date';

function CalendarEventDate({ when }) {
  if (when.object === 'date') {
    return (
      <p style={styles.CalendarEventDate.text}>
        Date: {new Date(when.date).toLocaleDateString()}
      </p>
    );
  }

  if (when.object === 'timespan') {
    return (
      <>
        <p style={styles.CalendarEventDate.text}>
          Start Time: {displayMeetingTime(when.start_time)}
        </p>
        <p style={styles.CalendarEventDate.text}>
          End Time: {displayMeetingTime(when.end_time)}
        </p>
      </>
    );
  }

  return null;
}

export default CalendarEventDate;
