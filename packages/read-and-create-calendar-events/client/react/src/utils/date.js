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
  return (
    date.toLocaleDateString('en-CA') +
    'T' +
    date.toLocaleTimeString('en-GB').split(':').slice(0, 2).join(':')
  );
};

export const applyTimezone = (date) => {
  const localizedDate = new Date(date);

  return getUnixTimestamp(localizedDate);
};

export const getUnixTimestamp = (date) => {
  return Math.floor(date.getTime() / 1000);
};
