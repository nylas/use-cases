function isOrderEmail(message) {
  return ['order', 'purchase', 'tracking'].some((word) =>
    message.subject.toLowerCase().includes(word)
  );
}

function prepEmailForParser(messageObj, rawEmail) {
  const encodeBase64 = (data) => Buffer.from(data).toString('base64');
  const senderEmail = messageObj.from[0].email;

  return {
    emailTimestamp: +messageObj.date * 1000,
    fetchedEmailId: messageObj.id,
    from: senderEmail,
    senderDomain: senderEmail.split('@')[1],
    textBase64: encodeBase64(rawEmail),
  };
}

module.exports = {
  isOrderEmail,
  prepEmailForParser,
};
