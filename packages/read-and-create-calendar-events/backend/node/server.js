const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Nylas = require('nylas');
require('express-async-errors');

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Few environment variables
const PORT = process.env.PORT || 3000;
const NYLAS_CLIENT_ID = String(process.env.NYLAS_CLIENT_ID || '');
const NYLAS_CLIENT_SECRET = String(process.env.NYLAS_CLIENT_SECRET || '');
const NYLAS_API_KEY = String(process.env.NYLAS_API_KEY || '');
const NYLAS_API_SERVER = process.env.NYLAS_API_SERVER;

// Small util function to convert camelCase to snake_case
function camelToCaseDeep(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => camelToCaseDeep(item));
  } else if (typeof obj === 'object' && obj !== null && obj.constructor === Object) {
    const newObj = {};
    for (const key in obj) {
      const newKey = key.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
      newObj[newKey] = camelToCaseDeep(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// Initialize the Nylas SDK using the client credentials
const nylas = new Nylas({
  apiKey: NYLAS_API_KEY,
  serverUrl: NYLAS_API_SERVER,
});

// Before we start our backend, we should register our frontend as a
// redirect URI to ensure the auth completes
const CLIENT_URI =
  process.env.CLIENT_URI || `http://localhost:${PORT}`;

nylas.applications.redirectUris.list().then(async (redirectUris) => {
  const redirectUri = redirectUris.data.find(
    (uri) => uri.url === CLIENT_URI
  );

  if (!redirectUri) {
    const newRedirectUri = await nylas.applications.redirectUris.create({
      platform: 'web',
      url: CLIENT_URI,
    }).then((uri) => uri.data);
    console.debug(`Redirect URI registered: ${newRedirectUri.url}`);
  } else {
    console.debug(`Redirect URI already registered.`);
  }
});


// '/nylas/generate-auth-url': This route builds the URL for
// authenticating users to your Nylas application via Hosted Authentication
app.post('/nylas/generate-auth-url', express.json(), async (req, res) => {
  const { body } = req;

  const authUrl = nylas.auth(NYLAS_CLIENT_ID, NYLAS_CLIENT_SECRET).urlForAuthentication({
    loginHint: body.email_address,
    redirectUri: CLIENT_URI
  });

  return res.json({
    auth_url: authUrl,
  });
});

app.get('/nylas/exchange-auth-code', express.json(), async (req, res) => {
  const code = String(req.query.code);
  const error = req.query.error;
  const errorDescription = req.query.error_description;

  if (error) {
    return res.status(400).json({
      error: error,
      error_description: errorDescription,
    });
  }

  const { grantId } = await nylas.auth(NYLAS_CLIENT_ID, NYLAS_CLIENT_SECRET).exchangeCodeForToken({
    code,
    redirectUri: CLIENT_URI,
  });

  return res.json({
    grant_id: grantId,
  });
});

// Add route for getting 20 latest calendar events
app.get('/nylas/:grantId/read-events', async (req, res) => {
  const grantId = String(req.params.grantId);
  const calendarId = String(req.query.calendarId);
  if (!calendarId) {
    return res.status(400).json({
      message: 'Calendar ID is required',
    });
  }

  const startsAfter = String(req.query.startsAfter);
  const startsBefore = String(req.query.startsBefore);
  const limit = Number(req.query.limit) || 20;

  const { data: events } = await nylas.events.list({
    identifier: grantId,
    queryParams: {
      calendarId,
      limit,
      start: startsAfter,
      end: startsBefore,
    }
  })

  return res.json(camelToCaseDeep(events));
});

// Add route for getting 20 latest calendar events
app.get('/nylas/:grantId/read-calendars', async (req, res) => {
  const grantId = String(req.params.grantId);
  const { data: calendars } = await nylas.calendars.list({
    identifier: grantId,
  });
  return res.json(camelToCaseDeep(calendars));
});

// Add route for creating calendar events
app.post('/nylas/:grantId/create-event', express.json(), async (req, res) => {
  const grantId = String(req.params.grantId);
  const { body } = req;

  const { data: event } = await nylas.events.create({
    identifier: grantId,
    requestBody: {
      title: body.title,
      description: body.description,
      location: body.location,
      participants: body?.participants?.split(",").map((email) => ({ email })) || [],
      when: {
        startTime: body.startTime,
        endTime: body.endTime,
      },
    },
    queryParams: {
      calendarId: body.calendarId,
    }
  });

  return res.json(camelToCaseDeep(event));
});

// Add a route for deleting grants
app.delete('/nylas/:grantId/delete-grant', async (req, res) => {
  const grantId = String(req.params.grantId);
  await nylas.auth(NYLAS_CLIENT_ID, NYLAS_CLIENT_SECRET).grants.destroy({grantId});
  return res.json({
    success: true,
  });
});

// Handle all uncaught errors
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    message: err.message,
  });
});

// Start listening on port 9000
app.listen(9000, () => console.log('App listening on port 9000'));
