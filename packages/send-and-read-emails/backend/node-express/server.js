const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockDb = require('./utils/mock-db');
const route = require('./route');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { ServerBindings } = require('nylas/lib/config');

dotenv.config();

// The port the express app will run on
const port = 9000;

// Initialize an instance of the Nylas SDK using the client credentials
const nylasClient = new Nylas({
  clientId: process.env.NYLAS_CLIENT_ID,
  clientSecret: process.env.NYLAS_CLIENT_SECRET,
});

const app = express();

// Enable CORS
app.use(cors());

// The uri for the frontend
const CLIENT_URI =
  process.env.CLIENT_URI || `http://localhost:${process.env.PORT || 3000}`;

// Use the express bindings provided by the SDK and pass in additional
// configuration such as auth scopes
const expressBinding = new ServerBindings.express(nylasClient, {
  defaultScopes: [Scope.EmailModify, Scope.EmailSend, Scope.EmailReadOnly],
  exchangeMailboxTokenCallback: async function exchangeMailboxTokenCallback(
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

// Handle when a new message is created (sent)
expressBinding.on(WebhookTriggers.MessageCreated, (payload) => {
  console.log(
    'Webhook trigger received, message created. Details: ',
    JSON.stringify(payload.objectData)
  );
});

// Start the Nylas webhook
expressBinding.startDevelopmentWebsocket().then((webhookDetails) => {
  console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id);
});

// Handle routes
app.post('/nylas/send-email', (req, res) =>
  route.sendEmail(req, res, nylasClient)
);
app.get('/nylas/read-emails', (req, res) =>
  route.readEmails(req, res, nylasClient)
);

app.get('/nylas/message', async (req, res) => {
  route.getMessage(req, res, nylasClient);
});

app.get('/nylas/file', async (req, res) => {
  route.getFile(req, res, nylasClient);
});

// Before we start our backend, we should whitelist our frontend as a redirect
// URI to ensure the auth completes
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
