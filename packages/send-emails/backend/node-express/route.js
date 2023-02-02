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

  const { to, subject, body } = req.body;

  const draft = new Draft(nylasClient.with(user.accessToken));

  draft.from = [{ email: user.emailAddress }];
  draft.to = [{ email: to }];
  draft.subject = subject;
  draft.body = body;

  const message = await draft.send();

  return res.json(message);
};
