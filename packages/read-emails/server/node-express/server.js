const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { mockDb } = require("./utils/mock-db");
const { prettyPrintJSON } = require("./utils/formatting");

const Nylas = require("nylas");
const { WebhookTriggers } = require("nylas/lib/models/webhook");
const { Scope } = require("nylas/lib/models/connect");
const { ServerBindings } = require("nylas/lib/config");

dotenv.config();

// The port the express app will run on
const port = 9000;

// Initialize an instance of the Nylas SDK using the client credentials
const nylasClient = new Nylas({
  clientId: process.env.YOUR_APP_CLIENT_ID,
  clientSecret: process.env.YOUR_APP_CLIENT_SECRET,
});

// The uri for the frontend
const clientUri = "http://localhost:3000";

// Before we start our backend, we should whitelist our frontend as a redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [clientUri],
  })
  .then((applicationDetails) => {
    console.log(
      "Application whitelisted. Application Details: ",
      prettyPrintJSON(applicationDetails)
    );
    startExpress();
  });

const exchangeMailboxTokenCallback = async (accessTokenObj, res) => {
  // Normally store the access token in the DB
  const accessToken = accessTokenObj.accessToken;
  const emailAddress = accessTokenObj.emailAddress;
  console.log("Access Token was generated for: " + accessTokenObj.emailAddress);

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
    defaultScopes: [Scope.EmailReadOnly],
    exchangeMailboxTokenCallback,
    clientUri,
  });

  // Handle when an account gets connected
  expressBinding.on(WebhookTriggers.AccountConnected, (payload) => {
    console.log(
      "Webhook trigger received, account connected. Details: ",
      prettyPrintJSON(payload.objectData)
    );
  });

  // Mount the express middleware to your express app
  const nylasMiddleware = expressBinding.buildMiddleware();
  app.use("/nylas", nylasMiddleware);

  // Start the Nylas webhook
  expressBinding
    .startDevelopmentWebsocket()
    .then((webhookDetails) =>
      console.log("Webhook tunnel registered. Webhook ID: " + webhookDetails.id)
    );

  // Add route for getting 5 latest emails
  app.get("/nylas/read-emails", async (req, res) => {
    if (!req.headers.authorization) {
      return res.json("Unauthorized");
    }

    const user = await mockDb.findUser(req.headers.authorization);
    if (!user) {
      return res.json("Unauthorized");
    }

    const messages = await nylasClient
      .with(user.accessToken)
      .messages.list({ limit: 5 });

    return res.json(messages);
  });

  // Start listening on port 9000
  app.listen(port, () => console.log("App listening on port " + port));
};