export const displayMeetingTime = (timeframe) => {
  console.log(timeframe);
  const [startTime, endTime] = [timeframe.start_time, timeframe.end_time].map(
    (timestamp) => {
      return new Date(timestamp * 1000)
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })
        .toLowerCase();
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
