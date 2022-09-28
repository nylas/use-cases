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

// The uri for the frontend
const CLIENT_URI = `http://localhost:${process.env.PORT || 3000}`;

// Before we start our backend, we should whitelist our frontend as a
// redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [CLIENT_URI],
  })
  .then((applicationDetails) => {
    console.log(
      'Application whitelisted. Application Details: ',
      JSON.stringify(applicationDetails, undefined, 2)
    );
    startExpress();
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

const startExpress = () => {
  const app = express();

  // Enable CORS
  app.use(cors());

  // Use the express bindings provided by the SDK and pass in additional
  // configuration such as auth scopes
  const expressBinding = new ServerBindings.express(nylasClient, {
    defaultScopes: [Scope.Calendar],
    exchangeMailboxTokenCallback,
    clientUri: CLIENT_URI,
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

  // Handle when a calendar event is created
  expressBinding.on(WebhookTriggers.EventCreated, (payload) => {
    console.log(
      'Webhook trigger received, calendar event created. Details: ',
      JSON.stringify(payload.objectData, undefined, 2)
    );
  });

  // Start the Nylas webhook
  expressBinding
    .startDevelopmentWebsocket()
    .then((webhookDetails) =>
      console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id)
    );

  // Add route for getting 20 latest calendar events
  app.get('/nylas/read-events', (req, res) =>
    route.readEvents(req, res, nylasClient)
  );

  // Add route for getting 20 latest calendar events
  app.get('/nylas/read-calendars', (req, res) =>
    route.readCalendars(req, res, nylasClient)
  );

  // Add route for creating calendar events
  app.post('/nylas/create-events', (req, res) =>
    route.createEvents(req, res, nylasClient)
  );

  // Start listening on port 9000
  app.listen(port, () => console.log('App listening on port ' + port));
};
