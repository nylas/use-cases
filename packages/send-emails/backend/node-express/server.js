const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockDb = require('./utils/mock-db');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { ServerBindings } = require('nylas/lib/config');
const { default: Draft } = require('nylas/lib/models/draft');

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
const CLIENT_URI = `http://localhost:${process.env.PORT || 3000}`;

// Use the express bindings provided by the SDK and pass in additional
// configuration such as auth scopes
const expressBinding = new ServerBindings.express(nylasClient, {
  defaultScopes: [Scope.EmailModify, Scope.EmailSend],
  exchangeMailboxTokenCallback: async function exchangeMailboxTokenCallback(
    accessTokenObj,
    res
  ) {
    const { emailAddress, accessToken } = accessTokenObj;

    // Normally store the access token in the DB
    console.log('Access Token was generated for: ' + emailAddress);

    // Replace this mock code with your actual database operations
    const user = await mockDb.createOrUpdateUser(emailAddress, {
      accessToken,
      emailAddress,
    });

    // Replace this mock code with your actual database operations
    res.json({
      id: user.id,
      emailAddress: user.emailAddress,
    });
  },
  clientUri: `CLIENT_URI,
});

// Mount the express middleware to your express app
const nylasMiddleware = expressBinding.buildMiddleware();
app.use('/nylas', nylasMiddleware);

// Handle when an account gets connected
expressBinding.on(WebhookTriggers.AccountConnected, (payload) => {
  console.log(
    'Webhook trigger received, account connected. Details: ',
    JSON.stringify(payload.objectData, undefined, 2)
  );
});

// Handle when a new message is created (sent)
expressBinding.on(WebhookTriggers.MessageCreated, (payload) => {
  console.log(
    'Webhook trigger received, message created. Details: ',
    JSON.stringify(payload.objectData, undefined, 2)
  );
});

// Start the Nylas webhook
expressBinding.startDevelopmentWebsocket().then((webhookDetails) => {
  console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id);
});

// Add some routes for the backend
app.post('/nylas/send-email', async (req, res) => {
  const requestBody = req.body;

  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json('Unauthorized');
  }

  const { to, body } = requestBody;

  const draft = new Draft(nylasClient.with(user.accessToken));

  draft.to = [{ email: to }];
  draft.body = body;
  draft.from = [{ email: user.emailAddress }];

  const message = await draft.send();

  return res.json({ message });
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
