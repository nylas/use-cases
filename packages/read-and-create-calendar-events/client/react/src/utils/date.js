export const displayMeetingTime = (timestamp) => {
  const date = new Date(timestamp * 1000);

  return `${date.toLocaleDateString('en-US', {
    dateStyle: 'medium',
  })} ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })}`;
};

export const getLocalDateString = (date) => {
  const localDate = date.toLocaleDateString('en-CA', {hour12: false});
  return (
    localDate +
    'T' +
    localDate.split(':').slice(0, 2).join(':')
  );
};

export const applyTimezone = (date) => {
  const localizedDate = new Date(date);

  return getUnixTimestamp(localizedDate);
};

export const getTodaysDateTimestamp = () => {
  const date = new Date();
  return applyTimezone(getLocalDateString(date));
};

export const getSevenDaysFromTodayDateTimestamp = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return applyTimezone(getLocalDateString(date));
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

export const getUnixTimestamp = (date) => {
  return Math.floor(date.getTime() / 1000);
};
