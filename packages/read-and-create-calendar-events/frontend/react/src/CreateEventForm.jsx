import PropTypes from 'prop-types';
import React, { useState } from 'react';
import AppContext from './contexts/AppContext';
import {
  applyTimezone,
  convertUTCDate,
  getDefaultEventEndTime,
  getDefaultEventStartTime,
  getMinimumEventEndTime,
  utcStringToDateObject,
} from './utils/date';

function CreateEventForm({
  calendarId,
  setShowCreateEventForm,
  setToastNotification,
  refresh,
}) {
  const app = React.useContext(AppContext);
  const [startTime, setStartTime] = useState(getDefaultEventStartTime());
  const [endTime, setEndTime] = useState(getDefaultEventEndTime());
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState(
    sessionStorage.getItem('userEmail') || ''
  );
  const [description, setDescription] = useState('');

  const now = new Date();

  const createEvent = async (e) => {
    e.preventDefault();

    try {
      const data = await app.api.createEvent({
        grantId: app.grantId,
        calendarId,
        startTime: applyTimezone(startTime),
        endTime: applyTimezone(endTime),
        title,
        description,
        calendarId,
        participants
      });

      console.log('Event created:', data);

      // reset form fields
      setStartTime(convertUTCDate(new Date()));
      setEndTime(convertUTCDate(new Date()));
      setTitle('');
      setDescription('');
      setShowCreateEventForm(false);
      setToastNotification('success');
      refresh();
    } catch (err) {
      setToastNotification('error');
      console.warn(`Error creating event:`, err);
    }
  };

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
          <button className="blue" type="submit" form="event-form">
            Create
          </button>
        </div>
      </div>
      <form id="event-form" className="scrollbar" onSubmit={createEvent}>
        <div className="row">
          <div className="field-container">
            <label htmlFor="event-title">Event title*</label>
            <input
              type="text"
              name="event-title"
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
            <label htmlFor="event-start-time">Start time*</label>
            <input
              type="datetime-local"
              name="event-start-time"
              onChange={(event) => {
                setStartTime(utcStringToDateObject(event.target.value));
              }}
              value={startTime.toISOString().substring(0, 16)}
              min={convertUTCDate(now)}
            />
          </div>
          <div className="field-container">
            <label htmlFor="event-end-time">End time*</label>
            <input
              type="datetime-local"
              name="event-end-time"
              onChange={(event) => {
                setEndTime(utcStringToDateObject(event.target.value));
              }}
              value={endTime.toISOString().substring(0, 16)}
              min={convertUTCDate(getMinimumEventEndTime(startTime))}
            />
          </div>
        </div>
        <div className="row">
          <div className="field-container">
            <label htmlFor="participants">Participants*</label>
            <textarea
              type="text"
              name="participants"
              placeholder="Enter email addresses"
              onChange={(event) => {
                setParticipants(event.target.value);
              }}
              spellCheck={false}
              value={participants}
              rows={1}
            />
            <p className="note">Separate by comma for multiple participants</p>
          </div>
        </div>
        <div className="row">
          <div className="field-container">
            <label htmlFor="description">Description</label>
            <textarea
              type="text"
              name="description"
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              placeholder="Enter event description"
              value={description}
              rows={3}
              width="100%"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

CreateEventForm.propTypes = {
  setShowCreateEventForm: PropTypes.func,
  toastNotification: PropTypes.string,
  setToastNotification: PropTypes.func,
  refresh: PropTypes.func,
};

export default CreateEventForm;
