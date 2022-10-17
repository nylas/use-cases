import { useState } from 'react';
import { styles } from './styles';
import {
  applyTimezone,
  currentTime,
  currentTimePlusHalfHour,
  getLocalDateString,
} from './utils/date';

function CreateEventForm({ userId, serverBaseUrl, calendarId }) {
  const [startTime, setStartTime] = useState(currentTime());
  const [endTime, setEndTime] = useState(currentTimePlusHalfHour());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const now = new Date();

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      const url = serverBaseUrl + '/nylas/create-events';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: applyTimezone(startTime),
          endTime: applyTimezone(endTime),
          title,
          description,
          calendarId,
        }),
      });

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      const data = await res.json();

      console.log('Event created:', data);

      // reset form fields
      setStartTime(getLocalDateString(new Date()));
      setEndTime(getLocalDateString(new Date()));
      setTitle('');
      setDescription('');
    } catch (err) {
      console.warn(`Error creating event:`, err);
    }
  };

  return (
    <div style={styles.CreateEventForm.container}>
      <h2 style={styles.CreateEventForm.header}>Create event</h2>

      <form style={styles.CreateEventForm.form} onSubmit={createEvent}>
        <label style={styles.CreateEventForm.label} htmlFor="event-start-time">
          Choose a start time:
        </label>
        <input
          style={styles.CreateEventForm.input}
          type="datetime-local"
          name="event-start-time"
          onChange={(event) => {
            setStartTime(event.target.value);
          }}
          value={startTime}
          min={getLocalDateString(now)}
        />

        <label style={styles.CreateEventForm.label} htmlFor="event-end-time">
          Choose an end time:
        </label>
        <input
          style={styles.CreateEventForm.input}
          type="datetime-local"
          name="event-end-time"
          onChange={(event) => {
            setEndTime(event.target.value);
          }}
          value={endTime}
          min={getLocalDateString(now)}
        />

        <label style={styles.CreateEventForm.label} htmlFor="title">
          Title:
        </label>
        <input
          style={styles.CreateEventForm.input}
          type="text"
          name="title"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          value={title}
        />

        <label style={styles.CreateEventForm.label} htmlFor="description">
          Description:
        </label>
        <textarea
          style={styles.CreateEventForm.input}
          type="text"
          name="description"
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          value={description}
          rows={10}
          width="100%"
        />

        <button style={styles.CreateEventForm.button} type="submit">
          Create Event
        </button>
      </form>
    </div>
  );
}

export default CreateEventForm;
