import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  applyTimezone,
  currentTime,
  currentTimePlusHalfHour,
  getLocalDateString,
} from './utils/date';

function CreateEventForm({ setShowCreateEventForm }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const now = new Date();

  // const createEvent = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const url = serverBaseUrl + '/nylas/create-events';

  //     const res = await fetch(url, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: userId,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         startTime: applyTimezone(startTime),
  //         endTime: applyTimezone(endTime),
  //         title,
  //         description,
  //         calendarId,
  //       }),
  //     });

  //     if (!res.ok) {
  //       throw new Error(res.statusText);
  //     }

  //     const data = await res.json();

  //     console.log('Event created:', data);

  //     // reset form fields
  //     setStartTime(getLocalDateString(new Date()));
  //     setEndTime(getLocalDateString(new Date()));
  //     setTitle('');
  //     setDescription('');
  //   } catch (err) {
  //     console.warn(`Error creating event:`, err);
  //   }
  // };

  return (
    <div className="create-event-view">
      <div className="header">
        <div className="title">Create event</div>
        <div className="button-container">
          <button
            type="button"
            className="outline"
            onClick={() => setShowCreateEventForm(false)}
          >
            Cancel
          </button>
          <button className="blue">Create</button>
        </div>
      </div>
      <form>
        <div className="row">
          <div className="field-container">
            <label htmlFor="event-title">Event title</label>
            <input
              type="text"
              name="event title"
              placeholder="Discuss calendar APIs"
              onChange={(event) => {
                setTitle(event.target.value);
              }}
              value={title}
            />
          </div>
        </div>
        <div className="row">
          <div className="field-container">
            <label htmlFor="event-start-time">Start time</label>
            <input
              type="datetime-local"
              name="event-start-time"
              className={startTime === '' ? 'placeholder' : ''}
              onChange={(event) => {
                setStartTime(event.target.value);
              }}
              value={startTime}
              min={getLocalDateString(now)}
            />
          </div>
          <div className="field-container">
            <label htmlFor="event-end-time">End time</label>
            <input
              type="datetime-local"
              name="event-end-time"
              className={endTime === '' ? 'placeholder' : ''}
              onChange={(event) => {
                setEndTime(event.target.value);
              }}
              value={endTime}
              min={getLocalDateString(now)}
            />
          </div>
        </div>
        <div className="row">
          <div className="field-container">
            <label htmlFor="event-start-time">Start time</label>
            <input
              type="datetime-local"
              name="event-start-time"
              onChange={(event) => {
                setStartTime(event.target.value);
              }}
              value={startTime}
              min={getLocalDateString(now)}
            />
          </div>
        </div>
        <div className="row">
          <div className="field-container">
            <label htmlFor="event-title">Event title</label>
            <input
              type="text"
              name="event title"
              placeholder="Discuss calendar APIs"
              onChange={(event) => {
                setTitle(event.target.value);
              }}
              value={title}
            />
          </div>
        </div>
      </form>
    </div>
  );

  // return (
  //   <div style={styles.CreateEventForm.container}>
  //     <h2 style={styles.CreateEventForm.header}>Create event</h2>

  //     <form style={styles.CreateEventForm.form} onSubmit={createEvent}>
  //       <label style={styles.CreateEventForm.label} htmlFor="event-start-time">
  //         Choose a start time:
  //       </label>
  //       <input
  //         style={styles.CreateEventForm.input}
  //         type="datetime-local"
  //         name="event-start-time"
  //         onChange={(event) => {
  //           setStartTime(event.target.value);
  //         }}
  //         value={startTime}
  //         min={getLocalDateString(now)}
  //       />

  //       <label style={styles.CreateEventForm.label} htmlFor="event-end-time">
  //         Choose an end time:
  //       </label>
  //       <input
  //         style={styles.CreateEventForm.input}
  //         type="datetime-local"
  //         name="event-end-time"
  //         onChange={(event) => {
  //           setEndTime(event.target.value);
  //         }}
  //         value={endTime}
  //         min={getLocalDateString(now)}
  //       />

  //       <label style={styles.CreateEventForm.label} htmlFor="title">
  //         Title:
  //       </label>
  //       <input
  //         style={styles.CreateEventForm.input}
  //         type="text"
  //         name="title"
  //         onChange={(event) => {
  //           setTitle(event.target.value);
  //         }}
  //         value={title}
  //       />

  //       <label style={styles.CreateEventForm.label} htmlFor="description">
  //         Description:
  //       </label>
  //       <textarea
  //         style={styles.CreateEventForm.input}
  //         type="text"
  //         name="description"
  //         onChange={(event) => {
  //           setDescription(event.target.value);
  //         }}
  //         value={description}
  //         rows={10}
  //         width="100%"
  //       />

  //       <button style={styles.CreateEventForm.button} type="submit">
  //         Create Event
  //       </button>
  //     </form>
  //   </div>
  // );
}

CreateEventForm.propTypes = {
  setShowCreateEventForm: PropTypes.func,
};

export default CreateEventForm;
