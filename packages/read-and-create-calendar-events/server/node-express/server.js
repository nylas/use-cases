const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { mockDb } = require('./utils/mock-db');
const { prettyPrintJSON } = require('./utils/formatting');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { ServerBindings } = require('nylas/lib/config');
const { default: Event } = require('nylas/lib/models/event');

dotenv.config();

// The port the express app will run on
const port = 9000;

// Initialize an instance of the Nylas SDK using the client credentials
const nylasClient = new Nylas({
  clientId: process.env.YOUR_APP_CLIENT_ID,
  clientSecret: process.env.YOUR_APP_CLIENT_SECRET,
});

// The uri for the frontend
const clientUri = 'http://localhost:3000';

// Before we start our backend, we should whitelist our frontend as a redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [clientUri],
  })
  .then((applicationDetails) => {
    console.log(
      'Application whitelisted. Application Details: ',
      prettyPrintJSON(applicationDetails)
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

  // Use the express bindings provided by the SDK and pass in additional configuration such as auth scopes
  const expressBinding = new ServerBindings.express(nylasClient, {
    defaultScopes: [Scope.Calendar],
    exchangeMailboxTokenCallback,
    clientUri,
  });

  // Handle when an account gets connected
  expressBinding.on(WebhookTriggers.AccountConnected, (payload) => {
    console.log(
      'Webhook trigger received, account connected. Details: ',
      prettyPrintJSON(payload.objectData)
    );
  });

  // Handle when a calendar event is created
  expressBinding.on(WebhookTriggers.EventCreated, (payload) => {
    console.log(
      'Webhook trigger received, calendar event created. Details: ',
      prettyPrintJSON(payload.objectData)
    );
  });

  // Mount the express middleware to your express app
  const nylasMiddleware = expressBinding.buildMiddleware();
  app.use('/nylas', nylasMiddleware);

  // Add route for getting 20 latest calendar events
  app.get('/nylas/read-events', async (req, res) => {
    if (!req.headers.authorization) {
      return res.json('Unauthorized');
    }

    const user = await mockDb.findUser(req.headers.authorization);
    if (!user) {
      return res.json('Unauthorized');
    }

    const events = await nylasClient
      .with(user.accessToken)
      .events.list({
        starts_after: Math.floor(new Date().getTime() / 1000),
        limit: 20,
        ...(req.query.calendarId && { calendar_id: req.query.calendarId }),
      })
      .then((events) => events);

    return res.json(events);
  });

  // Add route for getting 20 latest calendar events
  app.get('/nylas/read-calendars', async (req, res) => {
    if (!req.headers.authorization) {
      return res.json('Unauthorized');
    }

    const user = await mockDb.findUser(req.headers.authorization);
    if (!user) {
      return res.json('Unauthorized');
    }

    const calendars = await nylasClient
      .with(user.accessToken)
      .calendars.list()
      .then((calendars) => calendars);

    return res.json(calendars);
  });

  // Add route for creating calendar events
  app.post('/nylas/create-events', async (req, res) => {
    if (!req.headers.authorization) {
      return res.json('Unauthorized');
    }

    const user = await mockDb.findUser(req.headers.authorization);
    if (!user) {
      return res.json('Unauthorized');
    }

    const { calendarId, title, description, startTime, endTime } = req.body;
    if (!calendarId || !title || !startTime || !endTime) {
      return res.json(
        'Missing required fields: calendarId, title, starTime or endTime'
      );
    }

    const nylas = nylasClient.with(user.accessToken);

    const event = new Event(nylas);

    event.calendarId = calendarId;
    event.title = title;
    event.description = description;
    event.when.startTime = startTime;
    event.when.endTime = endTime;

    event.save();

    return res.json(event);
  });

  // Start listening on port 9000
  app.listen(port, () => console.log('App listening on port ' + port));
};
