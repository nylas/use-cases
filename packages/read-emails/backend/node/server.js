const dotenv = require('dotenv');
const url = require('url');
const mockDb = require('./utils/mock-db');
const { mockServer, getReqBody } = require('./utils/mock-server');

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
  clientId: process.env.NYLAS_CLIENT_ID,
  clientSecret: process.env.NYLAS_CLIENT_SECRET,
});

// The uri for the frontend
const CLIENT_URI =
  process.env.CLIENT_URI || `http://localhost:${process.env.PORT || 3000}`;

// Use the routes provided by the Nylas Node SDK to quickly implement
// the authentication flow
const { buildAuthUrl, exchangeCodeForToken } = NylasRoutes(nylasClient);

// Configure the Nylas routes using your flavour of backend framework
// '/nylas/generate-auth-url': This route builds the URL for authenticating
// users to your Nylas application via Hosted Authentication
mockServer.post(DefaultPaths.buildAuthUrl, async (req, res) => {
  const body = await getReqBody(req);

  const authUrl = await buildAuthUrl({
    scopes: [Scope.EmailReadOnly],
    emailAddress: body.email_address,
    successUrl: body.success_url,
    clientUri: CLIENT_URI,
  });

  res.writeHead(200).end(authUrl);
});

// '/nylas/exchange-mailbox-token': This route exchanges an
// authorization code for an access token
mockServer.post(DefaultPaths.exchangeCodeForToken, async (req, res) => {
  const body = await getReqBody(req);

  try {
    const { accessToken, emailAddress } = await exchangeCodeForToken(
      body.token
    );

    // Normally store the access token in the DB
    console.log('Access Token was generated for: ' + emailAddress);
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

  const threads = await nylasClient
    .with(user.accessToken)
    .threads.list({ limit: 5, expanded: true });

  return res.writeHead(200).end(JSON.stringify(threads));
});

// Add route for fetching message
mockServer.get('/nylas/message', async (req, res) => {
  if (!req.headers.authorization) {
    return res.writeHead(401).end('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.writeHead(401).end('Unauthorized');
  }

  const { id } = url.parse(req.url, true).query;
  const message = await nylasClient.with(user.accessToken).messages.find(id);

  return res.writeHead(200).end(JSON.stringify(message));
});

// Add route for download file
mockServer.get('/nylas/file', async (req, res) => {
  if (!req.headers.authorization) {
    return res.writeHead(401).end('Unauthorized');
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.writeHead(401).end('Unauthorized');
  }

  const { id } = url.parse(req.url, true).query;
  const file = await nylasClient.with(user.accessToken).files.find(id);

  // Files will be returned as a binary object
  const fileData = await file.download();

  return res.writeHead(200).end(fileData?.body);
});

// Start the Nylas webhook
openWebhookTunnel(nylasClient, {
  // Handle when a new message is created (sent)
  onMessage: function handleEvent(delta) {
    switch (delta.type) {
      case WebhookTriggers.AccountConnected:
        console.log(
          'Webhook trigger received, account connected. Details: ',
          JSON.stringify(delta.objectData, undefined, 2)
        );
        break;
    }
  },
}).then((webhookDetails) =>
  console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id)
);

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
  });

// Start listening on port 9000
mockServer.init().listen(port);
console.log('App listening on port ' + port);
