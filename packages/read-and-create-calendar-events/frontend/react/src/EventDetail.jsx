import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import CalendarIllustration from './components/icons/illustration-calendar.svg';
import {
  displayMeetingTime,
  getFormattedDate,
  getTimezoneCode,
} from './utils/date';
import {
  isValidUrl,
  getOrganizerString,
  getParticipantsString,
  cleanDescription,
  dividerBullet,
  showTopScrollShadow,
  showBottomScrollShadow,
  initializeScrollShadow,
  handleScrollShadows,
} from './utils/calendar';

function EventDetail({ selectedEvent }) {
  useEffect(() => {
    initializeScrollShadow('.description-container');
  }, []);

  useEffect(() => {
    window.addEventListener('resize', () =>
      initializeScrollShadow('.description-container')
    );

    return () => {
      window.removeEventListener('resize', () =>
        initializeScrollShadow('.description-container')
      );
    };
  }, []);

  return (
    <div className="event-detail-view">
      {selectedEvent ? (
        <div className="selected">
          <div className="details">
            <div className="event-detail">
              <span className="title truncate">{selectedEvent.title}</span>
            </div>
            <div className="event-detail">
              <span>{getFormattedDate(selectedEvent)}</span>
              {dividerBullet}
              <span>
                {selectedEvent.when.object === 'date'
                  ? 'all day'
                  : displayMeetingTime(selectedEvent.when)}
                {` (${getTimezoneCode()})`}
              </span>
              {dividerBullet}
              <span className="location truncate">
                {isValidUrl(selectedEvent.location) ? (
                  <a
                    href={selectedEvent.location}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {selectedEvent.location}
                  </a>
                ) : (
                  selectedEvent.location
                )}
              </span>
            </div>

            <div className="event-detail">
              <p className="truncate">
                Organized by {getOrganizerString(selectedEvent)}
              </p>
            </div>
            <div className="event-detail">
              {getParticipantsString(selectedEvent)}
            </div>
          </div>
          <div
            className="description-container scrollbar"
            onScroll={handleScrollShadows}
          >
            <div
              className={`scroll-shadow top${
                showTopScrollShadow ? '' : ' hidden'
              }`}
            ></div>
            <p className="title">Description</p>
            <p
              dangerouslySetInnerHTML={{
                __html: cleanDescription(selectedEvent.description),
              }}
            ></p>
          </div>
          <div
            className={`scroll-shadow bottom${
              showBottomScrollShadow ? '' : ' hidden'
            }`}
          ></div>
        </div>
      ) : (
        <div className="empty-event">
          <img
            src={CalendarIllustration}
            alt="Calendar illustration"
            width="72"
          />
          <p>Select an event to view the event details</p>
        </div>
      )}
    </div>
  );
}

EventDetail.propTypes = {
  selectedEvent: PropTypes.object,
};

export default EventDetail;
