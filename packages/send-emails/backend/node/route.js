const { default: Draft } = require('nylas/lib/models/draft');
const mockDb = require('./utils/mock-db');
const { getReqBody } = require('./utils/mock-server');

exports.sendEmail = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.writeHead(401).end('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.writeHead(401).end('Unauthorized');
  }

  const { to, body } = await getReqBody(req);

  const draft = new Draft(nylasClient.with(user.accessToken));

  draft.from = [{ email: user.emailAddress }];
  draft.to = [{ email: to }];
  draft.body = body;

  const message = await draft.send();

  return res.writeHead(200).end(JSON.stringify(message));
};

exports.readEmails = async (req, res, nylasClient) => {
  if (!req.headers.authorization) {
    return res.writeHead(401).end('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.writeHead(401).end('Unauthorized');
  }

  const nylas = nylasClient.with(user.accessToken);

  const threads = await nylas.threads.list({ limit: 5 });

  return res.writeHead(200).end(JSON.stringify({ threads }));
};
