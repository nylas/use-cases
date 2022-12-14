const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockDb = require('./utils/mock-db');

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

// Add route for getting 5 latest emails
app.get('/nylas/read-emails', async (req, res) => {
  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json('Unauthorized');
  }

  const threads = await nylasClient
    .with(user.accessToken)
    .threads.list({ limit: 5, expanded: true });

  return res.json(threads);
});

// Add route for getting individual message by id
app.get('/nylas/message', async (req, res) => {
  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json('Unauthorized');
  }

  const { id } = req.query;
  const message = await nylasClient.with(user.accessToken).messages.find(id);

  return res.json(message);
});

// Add route for downloading file
app.get('/nylas/file', async (req, res) => {
  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.json('Unauthorized');
  }

  const { id } = req.query;
  const file = await nylasClient.with(user.accessToken).files.find(id);

  // Files will be returned as a binary object
  const fileData = await file.download();
  return res.json(fileData?.body);
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
