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
  const localDate = date.toLocaleDateString('en-CA', { hourCycle: 'h23' });
  const localTime = date.toLocaleTimeString('en-CA', { hourCycle: 'h23' });
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

export const currentTimeAddMinutes = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

export const getEventDate = (calendarEvent) => {
  return new Date(
    calendarEvent.when.object === 'date'
      ? calendarEvent.when.date
      : calendarEvent.when.start_time * 1000
  );
};

export const getFormattedDate = (event) => {
  const date = getEventDate(event);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = date.getDate();
  return `${month} ${day}`;
};

export const getTimezoneCode = () => {
  return DateTime.local().toFormat('ZZZZ');
};

export const getDefaultEventStartTime = () => {
  const startDate = getNextHalfHour();
  return getLocalDateString(startDate);
};

export const getDefaultEventEndTime = () => {
  const startDate = getNextHalfHour();
  const endDate = getOneHourFromPassedTimestamp(startDate);
  return getLocalDateString(endDate);
};

const getNextHalfHour = () => {
  const date = new Date();
  const currentMinutes = date.getMinutes();
  const minutesToAdd = 30 - (currentMinutes % 30 || 0);

  return currentTimeAddMinutes(minutesToAdd);
  // date.setMinutes(currentMinutes + minutesToAdd);

  // return date;
};

export const getOneHourFromPassedTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  date.setHours(timestamp.getHours() + 1);

  return date;
};
