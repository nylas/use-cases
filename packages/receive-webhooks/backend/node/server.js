/**
 * A simple Node.js server that receives webhooks from the Nylas Webhook Service and logs them to the console.
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// Enable CORS
app.use(cors());

// The port the express app will run on
const port = 9000;

// Nylas app credentials
const NYLAS_CLIENT_SECRET = process.env.NYLAS_CLIENT_SECRET;
if (!NYLAS_CLIENT_SECRET) {
  throw new Error('NYLAS_CLIENT_SECRET is required');
}

// Verify the Nylas Webhook signature
function verifyWebhookSignature(nylasClientSecret, nylasSignature, rawBody) {
  const digest = crypto
    .createHmac('sha256', nylasClientSecret)
    .update(rawBody)
    .digest('hex');
  return digest === nylasSignature;
}

/**
 * A get endpoint that will validate the Nylas Webhook challenge.
 * The challenge is a HMAC-SHA256 signature using the client secret as the key.
 */
app.get('/', async (req, res) => {
  // Log the challenge to the console
  console.log('Webhook challenge received: ', req.query.challenge);
  if (!req.query.challenge) {
    res.status(400).send('Missing challenge');
  }
  res.status(200).send(req.query.challenge);
});

// Create a callback route for the Nylas Webhook
app.post('/', express.json(), async (req, res) => {
  // Verify the Nylas Webhook signature to ensure the request is coming from Nylas
  const signature =
    req.headers['x-nylas-signature'] || req.headers['X-Nylas-Signature'];
  if (
    !verifyWebhookSignature(
      NYLAS_CLIENT_SECRET,
      signature,
      JSON.stringify(req.body)
    )
  ) {
    res.status(403).send('Invalid signature');
  }

  /**
   * The body of the request contains the event data.
   * See https://docs.nylas.com/reference#webhooks for more information.
   * Example body:
   * "deltas": [
   *     {
   *     "date": 1680028457,
   *     "object": "event",
   *     "type": "event.updated",
   *     "object_data": {
   *         "namespace_id": "nn14433otj12wn5u7w2izwgo",
   *         "account_id": "nn14433otj12wn5u7w2izwgo",
   *         "object": "event",
   *         "attributes": null,
   *         "id": "3df1f5uhstjtyeojpc0g2j",
   *         "metadata": null
   *     }
   *     }
   * ]
   */
  const { body } = req;

  // Log the webhook event to the console
  console.log('Webhook event received: ', JSON.stringify(body, undefined, 2));

  // Send a 200 response to the Nylas Webhook
  res.status(200).send({ success: true });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
