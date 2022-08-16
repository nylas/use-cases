const fastify = require('fastify');
const cors = require('@fastify/cors');
const dotenv = require('dotenv');
const { mockDb } = require('./utils/mock-db');
const { prettyPrintJSON } = require('./utils');
const route = require('./route');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { Routes: NylasRoutes } = require('nylas/lib/services/routes');
const { DefaultPaths } = require('nylas/lib/services/routes');
const { openWebhookTunnel } = require('nylas/lib/services/tunnel');

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

const app = fastify();

// Enable CORS
app.register(cors);

// The uri for the frontend
const CLIENT_URI = 'http://localhost:3000';

// Use the routes provided by the Nylas Node SDK to quickly implement the authentication flow
const { buildAuthUrl, exchangeCodeForToken } = NylasRoutes(nylasClient);

// Configure the Nylas routes using your flavour of backend framework, fastify in this case
app.post(DefaultPaths.buildAuthUrl, async (req, res) => {
  const authUrl = await buildAuthUrl({
    scopes: [Scope.EmailReadOnly],
    emailAddress: req.body.email_address,
    successUrl: req.body.success_url,
    CLIENT_URI,
  });
  res.status(200).send(authUrl);
});

app.post(DefaultPaths.exchangeCodeForToken, async (req, res) => {
  try {
    const accessTokenObj = await exchangeCodeForToken(req.body.token);

    await exchangeMailboxTokenCallback(accessTokenObj, res);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

if (process.env.NODE_ENV === 'development') {
  // Handle when a new message is created (sent)
  const handleEvent = (delta) => {
    switch (delta.type) {
      case WebhookTriggers.MessageCreated:
        console.log(
          'Webhook trigger received, message created. Details: ',
          prettyPrintJSON(delta.objectData)
        );
        break;
    }
  };

  // Start the Nylas webhook
  openWebhookTunnel(nylasClient, {
    onMessage: handleEvent,
  }).then((webhookDetails) =>
    console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id)
  );
}

// Handle routes
app.get('/', (req, res) => res.status(200).send('Ok'));

app.post('/nylas/send-email', (...args) =>
  route.sendEmail(...args, nylasClient)
);
app.get('/nylas/read-emails', (...args) =>
  route.readEmails(...args, nylasClient)
);

const startFastify = () => {
  // Start listening on port 9000
  app.listen({ port }).then(() => console.log('App listening on port' + port));
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
    startFastify();
  });
