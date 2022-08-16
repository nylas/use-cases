const fastify = require('fastify');
const cors = require('@fastify/cors');
const dotenv = require('dotenv');
const { mockDb } = require('./utils/mock-db');
const { prettyPrintJSON } = require('./utils/formatting');

const Nylas = require('nylas');
const { Scope } = require('nylas/lib/models/connect');
const { Routes: NylasRoutes } = require('nylas/lib/services/routes');
const { DefaultPaths } = require('nylas/lib/services/routes');

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
    startFastify();
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

const startFastify = () => {
  // Use the routes provided by the Nylas Node SDK to quickly implement the authentication flow
  const { buildAuthUrl, exchangeCodeForToken } = NylasRoutes(nylasClient);

  // Init the fastify server
  const app = fastify();

  // Enable CORS
  app.register(cors);

  // Configure the Nylas routes using your flavour of backend framework, fastify in this case
  app.post(DefaultPaths.buildAuthUrl, async (req, res) => {
    const authUrl = await buildAuthUrl({
      scopes: [Scope.EmailReadOnly],
      emailAddress: req.body.email_address,
      successUrl: req.body.success_url,
      clientUri,
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

  // Add some routes for the backend
  app.get('/', (req, res) => res.status(200).send('Ok'));

  // Add route for getting 5 latest emails
  app.get('/nylas/read-emails', async (req, res) => {
    if (!req.headers.authorization) {
      return res.json('Unauthorized');
    }

    const user = await mockDb.findUser(req.headers.authorization);
    if (!user) {
      return res.json('Unauthorized');
    }

    const messages = await nylasClient
      .with(user.accessToken)
      .messages.list({ limit: 5 });

    return res.send(messages);
  });

  // Start listening on port 9000
  app.listen({ port }).then(() => console.log('App listening on port' + port));
};
