import { DateTime } from 'luxon';

export const get12HourTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

export const displayMeetingTime = (timeframe) => {
  const [startTime, endTime] = [timeframe.start_time, timeframe.end_time].map(
    (timestamp) => {
      return get12HourTime(timestamp).toLowerCase();
    }
  );

  return `${
    startTime.slice(-2) === endTime.slice(-2)
      ? startTime.slice(0, -3)
      : startTime
  } - ${endTime}`;
};

export const getLocalDateString = (date) => {
  const localDate = date.toLocaleDateString('en-CA', { hour12: false });
  const localTime = date.toLocaleTimeString('en-CA', { hour12: false });
  return localDate + 'T' + localTime.split(':').slice(0, 2).join(':');
};

export const applyTimezone = (date) => {
  const localizedDate = new Date(date);

  return getUnixTimestamp(localizedDate);
};

export const getUnixTimestamp = (date) => {
  return Math.floor(date.getTime() / 1000);
};

export const getTodaysDateTimestamp = () => {
  const date = new Date();
  return applyTimezone(getLocalDateString(date));
};

export const getSevenDaysFromTodayDateTimestamp = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return applyTimezone(getLocalDateString(new Date(date)));
};

export const currentTime = () => {
  const date = new Date();
  return getLocalDateString(date);
};

export const currentTimePlusHalfHour = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  return getLocalDateString(date);
};

export const getEventDate = (calendarEvent) => {
  return new Date(
    calendarEvent.when.object === 'date'
      ? calendarEvent.when.date
      : calendarEvent.when.start_time * 1000
  );
};

// August 18  ·   8:00 - 9:00 am (Timezone)  ·  Location

export const getFormattedEventDetails = (event) => {
  const space = `\u00a0`;
  const date = getEventDate(event);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = date.getDate();
  const time =
    event.when.object === 'date' ? 'all day' : displayMeetingTime(event.when);
  const timezone = DateTime.local().toFormat('ZZZZ');
  const location = 'location';
  return `${month} ${day} ${space}· ${space} ${time} (${timezone}) ${space}·${space} ${location}`;
};
