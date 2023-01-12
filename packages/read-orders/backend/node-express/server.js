const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockDb = require('./utils/mock-db');
const axios = require('axios');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { ServerBindings } = require('nylas/lib/config');

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// The port the express app will run on
const port = 9000;

// Initialize an instance of the Nylas SDK using the client credentials
const nylasClient = new Nylas({
  clientId: process.env.NYLAS_CLIENT_ID,
  clientSecret: process.env.NYLAS_CLIENT_SECRET,
});

// The uri for the frontend
const CLIENT_URI =
  process.env.CLIENT_URI || `http://localhost:${process.env.PORT || 3000}`;

// Use the express bindings provided by the SDK and pass in
// additional configuration such as auth scopes
const expressBinding = new ServerBindings.express(nylasClient, {
  defaultScopes: [Scope.EmailReadOnly],
  exchangeMailboxTokenCallback: async function exchangeTokenCallback(
    accessTokenObj,
    res
  ) {
    // Normally store the access token in the DB
    const { accessToken, emailAddress } = accessTokenObj;
    console.log('Access Token was generated for: ' + emailAddress);

    // Replace this mock code with your actual database operations
    const user = await mockDb.createOrUpdateUser(emailAddress, {
      accessToken,
      emailAddress,
    });

    // Return an authorization object to the user
    res.json({
      id: user.id,
      emailAddress: user.emailAddress,
    });
  },
  clientUri: CLIENT_URI,
});

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

// Mount the express middleware to your express app
const nylasMiddleware = expressBinding.buildMiddleware();
app.use(nylasMiddleware);

// Handle when an account gets connected
expressBinding.on(WebhookTriggers.AccountConnected, (payload) => {
  console.log(
    'Webhook trigger received, account connected. Details: ',
    JSON.stringify(payload.objectData)
  );
});

// Start the Nylas webhook
expressBinding.startDevelopmentWebsocket().then((webhookDetails) => {
  console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id);
});

// Get messages and pass "order" emails to parser API
app.get('/nylas/get-orders', async (req, res) => {
  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json('Unauthorized');
  }

  const messages = await nylasClient
    .with(user.accessToken)
    .messages.list({ limit: 100, expanded: true });

  // Prepare raw emails for sending to the Nylas parser API
  const preppedEmails = await Promise.all(
    messages
      .filter(isOrderEmail)
      .map(async (message) =>
        prepEmailForParser(message, await getRawMessage(message))
      )
  );

  const parserUrl = `https://nylas-neural-parsers-test.us.nylas.com/parse_order`;

  const parserResponse = await axios.post(parserUrl, {
    metadata: { market: 'US' },
    emails: preppedEmails,
  });

  const parsedResponses = parserResponse.data.filter(
    (res) => res.status !== 'UNPROCESSED'
  );

  // add original email object to parserResponse object
  parsedResponses.forEach((parsedEmail) => {
    const originalEmailObj = messages.find(
      (msg) => msg.id === parsedEmail.fetched_email_id
    );
    parsedEmail.original_email_object = originalEmailObj;
  });

  return res.json(
    parsedResponses.filter((email) => email.email_category !== 'other')
  );

  async function getRawMessage(messageObj) {
    return await nylasClient
      .with(user.accessToken)
      .messages.findRaw(messageObj.id);
  }
});

// Before we start our backend, we should whitelist our frontend
// as a redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [CLIENT_URI],
  })
  .then((applicationDetails) => {
    console.log(
      'Application whitelisted. Application Details: ',
      JSON.stringify(applicationDetails)
    );
  });

// Start listening on port 9000
app.listen(port, () => console.log('App listening on port ' + port));
