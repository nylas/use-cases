const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockDb = require('./utils/mock-db');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { Routes: NylasRoutes } = require('nylas/lib/services/routes');
const { default: Draft } = require('nylas/lib/models/draft');
const { openWebhookTunnel } = require('nylas/lib/services/tunnel');

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

// Use the routes provided by the Nylas Node SDK to quickly implement
// the authentication flow
const { buildAuthUrl, exchangeCodeForToken } = NylasRoutes(nylasClient);

// '/nylas/generate-auth-url': This route builds the URL for
// authenticating users to your Nylas application via Hosted Authentication
app.post('/nylas/generate-auth-url', express.json(), async (req, res) => {
  const { body } = req;

  const authUrl = await buildAuthUrl({
    scopes: [Scope.EmailModify, Scope.EmailSend],
    emailAddress: body.email_address,
    successUrl: body.success_url,
    clientUri: CLIENT_URI,
  });

  return res.send(authUrl);
});

// '/nylas/exchange-mailbox-token': This route exchanges an authorization
// code for an access token
// and sends the details of the authenticated user to the client
app.post('/nylas/exchange-mailbox-token', express.json(), async (req, res) => {
  const body = req.body;

  const { accessToken, emailAddress } = await exchangeCodeForToken(body.token);

  // Normally store the access token in the DB
  console.log('Access Token was generated for: ' + emailAddress);

  // Replace this mock code with your actual database operations
  const user = await mockDb.createOrUpdateUser(emailAddress, {
    accessToken,
    emailAddress,
  });

  // Return an authorization object to the user
  return res.json({
    id: user.id,
    emailAddress: user.emailAddress,
  });
});

// Start the Nylas webhook
openWebhookTunnel(nylasClient, {
  // Handle when a new message is created (sent)
  onMessage: function handleEvent(delta) {
    switch (delta.type) {
      case WebhookTriggers.MessageCreated:
        console.log(
          'Webhook trigger received, message created. Details: ',
          JSON.stringify(delta.objectData, undefined, 2)
        );
        break;
    }
  },
}).then((webhookDetails) => {
  console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id);
});

async function isAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.status(401).json('Unauthorized');
  }

  res.locals.user = user;

  next();
}

// Add some routes for the backend
app.post(
  '/nylas/send-email',
  isAuthenticated,
  express.json(),
  async (req, res) => {
    const {
      body: { to, body },
    } = req;

    const user = res.locals.user;

    const draft = new Draft(nylasClient.with(user.accessToken));

    draft.to = [{ email: to }];
    draft.body = body;
    draft.subject = 'Hello from Nylas Quickstart! ✨';
    draft.from = [{ email: user.emailAddress }];

    const message = await draft.send();

    return res.json({ message });
  }
);

// Before we start our backend, we should whitelist our frontend
// as a redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [CLIENT_URI],
  })
  .then((applicationDetails) => {
    console.log(
      'Application whitelisted. Application Details: ',
      JSON.stringify(applicationDetails, undefined, 2)
    );
  });

// Start listening on port 9000
app.listen(port, () => console.log('App listening on port ' + port));
