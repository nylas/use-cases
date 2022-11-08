import DOMPurify from 'dompurify';

export const getOrganizerString = (event) => {
  const name = event.organizer_name;
  const email = event.organizer_email;
  return name ? `${name} (${email})` : email;
};

export const getParticipantsString = (event) => {
  const participantCount = event.participants.length;
  return `${participantCount} participant${participantCount === 1 ? '' : 's'}`;
};

export const cleanDescription = (description) => {
  if (!description) return '';

  let cleanedDescription = DOMPurify.sanitize(description, {
    USE_PROFILES: { html: true },
  });
  return cleanedDescription;
};

export const isValidUrl = (str) => {
  let url;
  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }
  return url;
};
export const dividerBullet = `\u00a0 · \u00a0`;
