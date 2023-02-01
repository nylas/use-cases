const { default: Draft } = require('nylas/lib/models/draft');
const mockDb = require('./utils/mock-db');

exports.sendEmail = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Missing authorization header' });
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json({ message: 'Unauthorized' });
  }

  const { to, subject, body, replyToMessageId } = req.body;

  const draft = new Draft(nylasClient.with(user.accessToken));

  draft.from = [{ email: user.emailAddress }];
  draft.to = [{ email: to }];
  draft.subject = subject;
  draft.body = body;
  draft.replyToMessageId = replyToMessageId;

  const message = await draft.send();

  return res.json(message);
};

exports.readEmails = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Missing authorization header' });
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json({ message: 'Unauthorized' });
  }

  const nylas = nylasClient.with(user.accessToken);

  const threads = await nylas.threads.list({ limit: 5, expanded: true });

  return res.json(threads);
};

exports.getMessage = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Missing authorization header' });
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json({ message: 'Unauthorized' });
  }

  const nylas = nylasClient.with(user.accessToken);

  const { id } = req.query;
  const message = await nylas.messages.find(id);

  return res.json(message);
};

exports.getFile = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.json({ message: 'Missing authorization header' });
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json({ message: 'Unauthorized' });
  }

  const nylas = nylasClient.with(user.accessToken);

  const { id } = req.query;
  const file = await nylas.files.find(id);

  // Files will be returned as a binary object
  const fileData = await file.download();

  return res.json(fileData?.body);
};
