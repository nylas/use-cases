const { default: Draft } = require("nylas/lib/models/draft");
const { mockDb } = require("./utils/mock-db");

exports.sendEmail = async (req, res, next, nylasClient) => {
  if (!req.headers.authorization) {
    console.log("no headers");
    return res.json("Unauthorized");
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json("Unauthorized");
  }

  const { to, body } = req.body;

  const draft = new Draft(nylasClient.with(user.accessToken));

  draft.from = [{ email: user.emailAddress }];
  draft.to = [{ email: to }];
  draft.body = body;

  const message = await draft.send();

  return res.json({ message });
};

exports.readEmails = async (req, res, next, nylasClient) => {
  if (!req.headers.authorization) {
    console.log("no headers");
    return res.json("Unauthorized");
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json("Unauthorized");
  }

  const nylas = nylasClient.with(user.accessToken);

  const threads = await nylas.threads.list({ limit: 50 });

  return res.json({ threads });
};
