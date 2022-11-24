import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import EmailIllustration from './components/icons/illustration-email.svg';
import ChevronDown from './components/icons/icon-chevron-down.svg';
import AttachmentIcon from './components/icons/icon-attachment.svg';
import IconSync from './components/icons/IconSync.jsx';
import { formatPreviewDate } from './utils/date.js';
import { cleanEmailBody } from './utils/email.js';

function EmailDetail({ selectedEmail, userEmail, serverBaseUrl, userId }) {
  const [messages, setMessages] = useState([]);
  const [collapsedCount, setCollapsedCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    const setupMessages = async () => {
      let showingMessages = selectedEmail.messages;
      if (selectedEmail.messages.length > 4) {
        showingMessages = [showingMessages[0], ...showingMessages.slice(-2)];
        setCollapsedCount(selectedEmail.messages.length - 3);
      }

      const latestMessage = await getMessage(
        showingMessages[showingMessages.length - 1]
      );

      setMessages(
        showingMessages.map((msg) => {
          if (msg.id === latestMessage.id) {
            msg = { ...latestMessage, expanded: true };
          }
          return msg;
        })
      );
    };

    if (selectedEmail?.messages?.length) {
      setupMessages();
    }
  }, [selectedEmail]);

  const getMessage = async (message) => {
    if (message.body) return message;

    setLoadingMessage(message.id);
    try {
      const queryParams = new URLSearchParams({ id: message.id });
      const url = `${serverBaseUrl}/nylas/message?${queryParams.toString()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: userId,
          'Content-Type': 'application/json',
        },
      });
      const messageData = await res.json();
      setLoadingMessage('');
      return messageData;
    } catch (e) {
      console.warn(`Error retrieving message:`, e);
      setLoadingMessage('');
      return false;
    }
  };

  const handleShowCollapsedMessages = (event) => {
    event.stopPropagation();
    if (messages.length === 3) {
      setMessages([
        messages[0],
        ...selectedEmail.messages.slice(1, -2),
        ...messages.slice(-2),
      ]);
      setCollapsedCount(0);
    }
  };

  const getMessageReceivers = (message) => {
    const receiverList = [];

    if (message?.to?.length) {
      for (let i = 0; i < message.to.length; i++) {
        if (i === 3) {
          receiverList.push(`+${(message.to.length - 3).toString()}`);
          break;
        }

        const to = message.to[i];
        receiverList.push(to.email === userEmail ? 'Me' : to.name || to.email);
      }
    }
    return receiverList.join(', ');
  };

  const handleToggleMessage = async (message) => {
    if (messages.length > 1) {
      if (message.expanded) {
        setMessages(
          messages.map((msg) => {
            if (msg.id === message.id) {
              msg.expanded = false;
              msg.showParticipants = false;
            }
            return msg;
          })
        );
      } else {
        const newMsg = await getMessage(message);
        setMessages(
          messages.map((msg) => {
            if (msg.id === newMsg.id) msg = { ...newMsg, expanded: true };
            return msg;
          })
        );
      }
    }
  };

  const handleToggleParticipants = (event, messageId) => {
    event.stopPropagation();
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId) {
          msg.showParticipants = !msg.showParticipants;
        }
        return msg;
      })
    );
  };

  const downloadAttachment = async (event, file) => {
    event.stopPropagation();
    try {
      const queryParams = new URLSearchParams({ id: file.id });
      const url = `${serverBaseUrl}/nylas/file?${queryParams.toString()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: userId,
          'Content-Type': 'application/json',
        },
      });
      const fileBuffer = await res.json();
      if (fileBuffer) downloadAttachedFile(fileBuffer, file);
    } catch (e) {
      console.warn(`Error retrieving emails:`, e);
      return false;
    }
  };

  function downloadAttachedFile(fileBuffer, file) {
    const buffer = Uint8Array.from(fileBuffer.data);
    const blob = new Blob([buffer], { type: file.content_type });
    const blobFile = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobFile;
    a.download = file.filename ?? file.id;
    a.target = '_blank';
    a.click();
    a.remove();
  }

  return (
    <div className="email-detail-view">
      {selectedEmail ? (
        <div className="selected">
          <h3 className="title">{selectedEmail.subject || '(no subject)'}</h3>
          <div className="label-container">
            {selectedEmail.labels?.map((label) => (
              <span key={label.id} className={`label ${label.name}`}>
                {label.display_name}
              </span>
            ))}
          </div>

          {/* Each email message can be expanded and collapsed */}
          <div className="message-list">
            {messages?.map((message, index) => {
              const isLoading = loadingMessage === message.id;
              return (
                <div
                  key={message.id}
                  className={`message-container`}
                  onClick={() => handleToggleMessage(message)}
                >
                  <div className="email-info">
                    <div className="sender-container">
                      {!!message.from?.length && (
                        <div className="sender">
                          <span className="sender-name">
                            {message.from[0].name}
                          </span>
                          {message.expanded && (
                            <span className="sender-email">
                              {message.from[0].email}
                            </span>
                          )}
                        </div>
                      )}
                      <span>
                        {formatPreviewDate(
                          new Date(Math.floor(message.date * 1000)),
                          true
                        )}
                      </span>
                    </div>
                    {message.expanded && (
                      <div
                        className={`receiver-container`}
                        onClick={(event) =>
                          handleToggleParticipants(event, message.id)
                        }
                      >
                        <span>to {getMessageReceivers(message)}</span>
                        <button className="collapse-button">
                          <img
                            className={`collapse-icon ${
                              message.showParticipants ? 'open' : ''
                            }`}
                            src={ChevronDown}
                            alt="chevron down"
                            width="10"
                          />
                        </button>
                      </div>
                    )}

                    {message.showParticipants && (
                      <div className="participants-container">
                        <div className="participants-title">From</div>
                        <div className="participants-list">
                          {message.from?.map((p) => (
                            <span key={p.email}>
                              {p.name ? `${p.name} - ` : ''}
                              {p.email}
                            </span>
                          ))}
                        </div>

                        <div className="participants-title">To</div>
                        <div className="participants-list">
                          {message.to?.map((p) => (
                            <span key={p.email}>
                              {p.name ? `${p.name} - ` : ''}
                              {p.email}
                            </span>
                          ))}
                        </div>

                        {!!message.cc?.length && (
                          <>
                            <div className="participants-title">CC</div>
                            <div className="participants-list">
                              {message.cc?.map((p) => (
                                <span key={p.email}>
                                  {p.name ? `${p.name} - ` : ''}
                                  {p.email}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {message.expanded ? (
                    <div className="email-body">
                      <div
                        className="email-body-html"
                        dangerouslySetInnerHTML={{
                          __html: cleanEmailBody(message.body),
                        }}
                      />

                      {!!message.files?.length && (
                        <div className="attachment-container">
                          <div className="attachment-title">
                            <span>Attachments</span>
                            <div className="line" />
                          </div>

                          <div className="attachment-files">
                            {message.files
                              .filter(
                                (file) =>
                                  file.content_disposition === 'attachment' &&
                                  !file.content_type.includes('calendar')
                              )
                              .map((f) => (
                                <div
                                  className="attachment"
                                  key={f.id}
                                  onClick={(event) =>
                                    downloadAttachment(event, f)
                                  }
                                >
                                  <img
                                    src={AttachmentIcon}
                                    alt="attachment icon"
                                    width="20"
                                  />
                                  <span>{f.filename}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="snippet">{message.snippet}</p>
                  )}

                  {isLoading && (
                    <div className="loading-icon">
                      <IconSync /> Loading...
                    </div>
                  )}

                  {index !== messages.length - 1 && (
                    <div
                      className="message-border"
                      onClick={handleShowCollapsedMessages}
                    >
                      {index === 0 && collapsedCount > 0 && (
                        <span>Show {collapsedCount} messages</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-email">
          <img src={EmailIllustration} alt="email illustration" width="72" />
          <p>Select an email to view the message.</p>
        </div>
      )}
    </div>
  );
}

EmailDetail.propTypes = {
  selectedEmail: PropTypes.object,
  userEmail: PropTypes.string.isRequired,
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default EmailDetail;
