const dotenv = require('dotenv');
const { mockDb } = require('./utils/mock-db');
const { mockServer, getReqBody } = require('./utils/mock-server');
const { prettyPrintJSON } = require('./utils/formatting');

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
    startServer();
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
  res.writeHead(200).end(
    JSON.stringify({
      id: user.id,
      emailAddress: user.emailAddress,
    })
  );
};

const startServer = () => {
  // Use the routes provided by the Nylas Node SDK to quickly implement the authentication flow
  const { buildAuthUrl, exchangeCodeForToken } = NylasRoutes(nylasClient);

  // Configure the Nylas routes using your flavour of backend framework
  mockServer.post(DefaultPaths.buildAuthUrl, async (req, res) => {
    const body = await getReqBody(req);

    const authUrl = await buildAuthUrl({
      scopes: [Scope.EmailReadOnly],
      emailAddress: body.email_address,
      successUrl: body.success_url,
      clientUri,
    });

    res.writeHead(200).end(authUrl);
  });

  mockServer.post(DefaultPaths.exchangeCodeForToken, async (req, res) => {
    const body = await getReqBody(req);

    try {
      const accessTokenObj = await exchangeCodeForToken(body.token);

      await exchangeMailboxTokenCallback(accessTokenObj, res);
    } catch (e) {
      res.writeHead(500).end(e.message);
    }
  });

  // Add route for getting 5 latest emails
  mockServer.get('/nylas/read-emails', async (req, res) => {
    if (!req.headers.authorization) {
      return res.writeHead(401).end('Unauthorized');
    }

    const user = await mockDb.findUser(req.headers.authorization);
    if (!user) {
      return res.writeHead(401).end('Unauthorized');
    }

    const messages = await nylasClient
      .with(user.accessToken)
      .messages.list({ limit: 5 });

    return res.writeHead(200).end(JSON.stringify(messages));
  });

  if (process.env.NODE_ENV === 'development') {
    // Handle when a new message is created (sent)
    const handleEvent = (delta) => {
      switch (delta.type) {
        case WebhookTriggers.AccountConnected:
          console.log(
            'Webhook trigger received, account connected. Details: ',
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

  // Start listening on port 9000
  mockServer.init().listen(port);
  console.log('App listening on port ' + port);
};
