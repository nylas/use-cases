import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CalendarIllustration from './components/icons/illustration-calendar.svg';
// import ChevronDown from './components/icons/icon-chevron-down.svg';
// import { formatPreviewDate } from './utils/date.js';
// import { cleanEmailBody } from './utils/email.js';
import {
  displayMeetingTime,
  // getEventDate,
  // getFormattedEventDetails,
  getFormattedDate,
  getTimezoneCode,
} from './utils/date';

import {
  isValidUrl,
  getOrganizerString,
  getParticipantsString,
  cleanDescription,
  dividerBullet,
} from './utils/calendar';

function EventDetail({ selectedEvent }) {
  // const eventDate = getEventDate(selectedEvent);
  // function EventDetail({ selectedEmail, userEmail }) {
  // const [emailSender, setEmailSender] = useState('');
  // const [emailReceivers, setEmailReceivers] = useState('');
  // const [showParticipants, setShowParticipants] = useState(false);
  // const organizer = getOrganizerString(selectedEvent);

  // useEffect(() => {
  //   if (selectedEmail?.from?.length) {
  //     setEmailSender(selectedEmail?.from?.[0]);
  //   } else {
  //     setEmailSender('');
  //   }
  //   getReceivers();
  // }, [selectedEmail]);

  // const getReceivers = () => {
  //   let receiversStr = '';
  //   const receiverList = [];

  //   if (selectedEmail?.to?.length) {
  //     for (let i = 0; i < selectedEmail.to.length; i++) {
  //       if (i === 3) {
  //         receiverList.push(`+${(selectedEmail.to.length - 3).toString()}`);
  //         break;
  //       }

  //       const to = selectedEmail.to[i];
  //       receiverList.push(to.email === userEmail ? 'Me' : to.name || to.email);
  //     }
  //   }
  //   receiversStr = receiverList.join(', ');
  //   setEmailReceivers(receiversStr);
  // };

  // console.log(getFormattedMonthAndDay(eventDate));
  return (
    <div className="event-detail-view">
      {selectedEvent ? (
        <div className="selected">
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
          <p className="description-header">Description</p>
          <p
            dangerouslySetInnerHTML={{
              __html: cleanDescription(selectedEvent.description),
            }}
          ></p>
        </div>
      ) : (
        // <div className="day">{eventDate.getDate()}</div>
        // <div className="month">
        //   {eventDate.toLocaleString('en-US', { month: 'short' })}
        // <div className="selected">
        //   <h3 className="title">{selectedEmail.subject}</h3>
        //   <div className="label-container">
        //     {selectedEmail.labels.map((label) => (
        //       <span key={label.id} className={`label ${label.name}`}>
        //         {label.display_name}
        //       </span>
        //     ))}
        //   </div>
        //   <div className="email-info">
        //     <div className="sender-container">
        //       {emailSender && (
        //         <div className="sender">
        //           <span className="sender-name">{emailSender.name}</span>
        //           <span className="sender-email">{emailSender.email}</span>
        //         </div>
        //       )}
        //       <span>
        //         {formatPreviewDate(
        //           new Date(Math.floor(selectedEmail.date * 1000)),
        //           true
        //         )}
        //       </span>
        //     </div>
        //     <div
        //       className="receiver-container"
        //       onClick={() => setShowParticipants((show) => !show)}
        //     >
        //       <span>to {emailReceivers}</span>
        //       <button className="collapse-button">
        //         <img
        //           className={`collapse-icon ${showParticipants ? 'open' : ''}`}
        //           src={ChevronDown}
        //           alt="chevron down"
        //           width="10"
        //         />
        //       </button>
        //     </div>

        //     {showParticipants && (
        //       <div className="participants-container">
        //         <div className="participants-title">From</div>
        //         <div className="participants-list">
        //           {selectedEmail.from.map((p) => (
        //             <span key={p.email}>
        //               {p.name ? `${p.name} - ` : ''}
        //               {p.email}
        //             </span>
        //           ))}
        //         </div>

        //         <div className="participants-title">To</div>
        //         <div className="participants-list">
        //           {selectedEmail.to.map((p) => (
        //             <span key={p.email}>
        //               {p.name ? `${p.name} - ` : ''}
        //               {p.email}
        //             </span>
        //           ))}
        //         </div>

        //         {!!selectedEmail.cc?.length && (
        //           <>
        //             <div className="participants-title">CC</div>
        //             <div className="participants-list">
        //               {selectedEmail.cc.map((p) => (
        //                 <span key={p.email}>
        //                   {p.name ? `${p.name} - ` : ''}
        //                   {p.email}
        //                 </span>
        //               ))}
        //             </div>
        //           </>
        //         )}
        //       </div>
        //     )}
        //   </div>
        //   <div className="email-body">
        //     <div
        //       className="email-body-text"
        //       dangerouslySetInnerHTML={{
        //         __html: cleanEmailBody(selectedEmail.body),
        //       }}
        //     />
        //   </div>
        // </div>
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
  // userEmail: PropTypes.string.isRequired,
};

export default EventDetail;
