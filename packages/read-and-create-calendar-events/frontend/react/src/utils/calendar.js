import DOMPurify from 'dompurify';
import { useState } from 'react';

const [showTopScrollShadow, setShowTopScrollShadow] = useState(false);
const [showBottomScrollShadow, setShowBottomScrollShadow] = useState(false);

export { showTopScrollShadow, setShowTopScrollShadow };
export { showBottomScrollShadow, setShowBottomScrollShadow };

export const initializeScrollShadow = (cssSelector) => {
  const scrollElement = document.querySelector(cssSelector);
  const isScrollable =
    scrollElement?.scrollHeight !== scrollElement?.clientHeight;

  setShowBottomScrollShadow(isScrollable);
};

export const handleScrollShadows = (event) => {
  const element = event.target;
  const atTop = element.scrollTop < 12;
  const atBottom =
    element.clientHeight + element.scrollTop + 12 > element.scrollHeight;

  setShowTopScrollShadow(!atTop);
  setShowBottomScrollShadow(!atBottom);
};

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
  if (!description) return 'No description.';

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
