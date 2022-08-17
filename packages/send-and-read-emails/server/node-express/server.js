const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { mockDb } = require('./utils/mock-db');
const { prettyPrintJSON } = require('./utils');
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
  clientId: process.env.YOUR_APP_CLIENT_ID,
  clientSecret: process.env.YOUR_APP_CLIENT_SECRET,
});

const exchangeMailboxTokenCallback = async (accessTokenObj, res) => {
  // Normally store the access token in the DB
  const accessToken = accessTokenObj.accessToken;
  const emailAddress = accessTokenObj.emailAddress;
  console.log('Access Token was generated for: ' + accessTokenObj.emailAddress);

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
};

const app = express();

// Enable CORS
app.use(cors());

// The uri for the frontend
const CLIENT_URI = 'http://localhost:3000';

// Use the express bindings provided by the SDK and pass in additional configuration such as auth scopes
const expressBinding = new ServerBindings.express(nylasClient, {
  defaultScopes: [Scope.EmailModify, Scope.EmailSend, Scope.EmailReadOnly],
  exchangeMailboxTokenCallback,
  clientUri: CLIENT_URI,
});

// Mount the express middleware to your express app
const nylasMiddleware = expressBinding.buildMiddleware();
app.use('/nylas', nylasMiddleware);

if (process.env.NODE_ENV === 'development') {
  // Handle when a new message is created (sent)
  expressBinding.on(WebhookTriggers.MessageCreated, (payload) => {
    console.log(
      'Webhook trigger received, message created. Details: ',
      prettyPrintJSON(payload.objectData)
    );
  });

  // Start the Nylas webhook
  expressBinding
    .startDevelopmentWebsocket()
    .then((webhookDetails) =>
      console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id)
    );
}

// Handle routes
app.get('/', (req, res) => res.status(200).send('Ok'));

app.post('/nylas/send-email', (req, res) =>
  route.sendEmail(req, res, nylasClient)
);
app.get('/nylas/read-emails', (req, res) =>
  route.readEmails(req, res, nylasClient)
);

const startExpress = () => {
  // Start listening on port 9000
  app.listen(port, () => console.log('App listening on port ' + port));
};

// Before we start our backend, we should whitelist our frontend as a redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [CLIENT_URI],
  })
  .then((applicationDetails) => {
    console.log(
      'Application whitelisted. Application Details: ',
      prettyPrintJSON(applicationDetails)
    );
    startExpress();
  });
