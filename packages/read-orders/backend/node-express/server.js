const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mockDb = require('./utils/mock-db');
const axios = require('axios');

const Nylas = require('nylas');
const { WebhookTriggers } = require('nylas/lib/models/webhook');
const { Scope } = require('nylas/lib/models/connect');
const { ServerBindings } = require('nylas/lib/config');

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

// Use the express bindings provided by the SDK and pass in
// additional configuration such as auth scopes
const expressBinding = new ServerBindings.express(nylasClient, {
  defaultScopes: [Scope.EmailReadOnly],
  exchangeMailboxTokenCallback: async function exchangeTokenCallback(
    accessTokenObj,
    res
  ) {
    // Normally store the access token in the DB
    const { accessToken, emailAddress } = accessTokenObj;
    console.log('Access Token was generated for: ' + emailAddress);

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
  },
  clientUri: CLIENT_URI,
});

function isOrderEmail(message) {
  return ['order', 'purchase', 'tracking'].some((word) =>
    message.subject.toLowerCase().includes(word)
  );
}

function prepEmailForParser(messageObj, rawEmail) {
  const senderEmail = isForwardedMessage(messageObj)
    ? getOriginalSender(messageObj)
    : messageObj.from[0].email;
  const senderDomain = senderEmail.split('@')[1].replace(/.ca$/, '.com');

  return {
    emailTimestamp: +messageObj.date * 1000,
    fetchedEmailId: messageObj.id,
    from: senderEmail,
    senderDomain: senderDomain,
    textBase64: encodeBase64(rawEmail),
  };

  function isForwardedMessage(message) {
    return message.snippet
      .toLowerCase()
      .includes('---------- forwarded message ---------');
  }

  function getOriginalSender(message) {
    return message.snippet.match(/<(\S+@\S+)>/)[1];
  }

  function encodeBase64(data) {
    return Buffer.from(data).toString('base64');
  }
}

// Mount the express middleware to your express app
const nylasMiddleware = expressBinding.buildMiddleware();
app.use(nylasMiddleware);

// Handle when an account gets connected
expressBinding.on(WebhookTriggers.AccountConnected, (payload) => {
  console.log(
    'Webhook trigger received, account connected. Details: ',
    JSON.stringify(payload.objectData)
  );
});

// Start the Nylas webhook
expressBinding.startDevelopmentWebsocket().then((webhookDetails) => {
  console.log('Webhook tunnel registered. Webhook ID: ' + webhookDetails.id);
});

// WIP: Get messages and pass "order" emails to parser API
app.get('/nylas/get-orders', async (req, res) => {
  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  // We still provide access to the RFC-2822 raw message object by passing in Accept: message/rfc822 as the header.
  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json('Unauthorized');
  }

  const messages = await nylasClient
    .with(user.accessToken)
    .messages.list({ limit: 100, expanded: true });

  let preppedEmails = await Promise.all(
    messages
      .filter(isOrderEmail)
      .map(async (message) =>
        prepEmailForParser(message, await getRawMessage(message))
      )
  );

  const url = `https://nylas-neural-parsers-test.us.nylas.com/parse_order`;

  const parserResponse = await axios.post(url, {
    metadata: { market: 'US' },
    emails: preppedEmails,
  });

  const parsedResponses = parserResponse.data.filter(
    (res) => res.status !== 'UNPROCESSED'
  );

  // add original email object to parserResponse object
  parsedResponses.forEach((parsedEmail) => {
    const originalEmailObj = messages.find(
      (msg) => msg.id === parsedEmail.fetched_email_id
    );
    parsedEmail.original_email_object = originalEmailObj;
  });

  return res.json(
    parsedResponses.filter((email) => email.email_category !== 'other')
  );

  async function getRawMessage(messageObj) {
    return await nylasClient
      .with(user.accessToken)
      .messages.findRaw(messageObj.id);
  }
});

app.get('/nylas/get-mock-orders', async (req, res) => {
  if (!req.headers.authorization) {
    return res.json('Unauthorized');
  }

  // We still provide access to the RFC-2822 raw message object by passing in Accept: message/rfc822 as the header.
  const user = await mockDb.findUser(req.headers.authorization);

  if (!user) {
    return res.json('Unauthorized');
  }

  const mockData = [
    {
      specversion: '1.0',
      status: 'SUCCESS',
      order: {
        coupon: null,
        currency: 'USD',
        discount: null,
        gift_card: null,
        line_items: [
          {
            name: 'Jay, hayyyshayyy has dispatched your order!',
            quantity: null,
            unit_price: null,
            product_id: null,
            color: null,
            size: null,
            url: `https://help.etsy.com/hc/articles/360020601674?
              campaign_label=shipping_notification_boe_convourl_treatment
              &utm_source=transactional&utm_campaign=shipping_notification_boe_convourl_treatment_010170_433263510924_0_0
              &utm_medium=email&utm_content=&email_sent=1640469464&euid=9Pr53Yl4PfY48SgbkTDkNq7fUJ3A&eaid=36678400514&x_eaid=61c3f1b72d&link_clicked=0`,
            product_image_uri:
              'https://i.etsystatic.com/7120425/r/il/821aa3/2792420144/il_170x135.2792420144_7dou.jpg',
          },
          {
            name: 'Jay, hayyyshayyy has dispatched your order!',
            quantity: null,
            unit_price: null,
            product_id: null,
            color: null,
            size: null,
            url: `https://help.etsy.com/hc/articles/360020601674?
            campaign_label=shipping_notification_boe_convourl_treatment
            &utm_source=transactional&utm_campaign=shipping_notification_boe_convourl_treatment_010170_433263510924_0_0
            &utm_medium=email&utm_content=&email_sent=1640469464&euid=9Pr53Yl4PfY48SgbkTDkNq7fUJ3A&eaid=36678400514&x_eaid=61c3f1b72d&link_clicked=0`,
            product_image_uri:
              'https://i.etsystatic.com/7120425/r/il/821aa3/2792420144/il_170x135.2792420144_7dou.jpg',
          },
        ],
        order_date: '2022-12-05T16:55:02-08:00',
        order_number: '2290912646',
        shipping_total: null,
        total_tax_amount: null,
        total_amount: null,
      },
      merchant: {
        name: 'Etsy',
        domain: 'etsy.com',
        tier: null,
      },
      fetched_email_id: 'abqqgqst36vrfhkz79zjprzgx',
      email_timestamp: 1670288102000000,
      error: null,
      validation_errors: null,
      metadata: {
        account_id: null,
        grant_id: null,
        application_id: null,
        email_category: null,
        sync_category: null,
        notification_timestamp: null,
        sync_requested_at: null,
        provider: null,
        language: null,
        market: 'US',
        redirect: null,
        memberId: null,
        sender_domain: 'etsy.com',
        message_id: null,
        vendor: 'nylas',
      },
      email_category: 'shipment_confirmation',
    },
    {
      specversion: '1.0',
      status: 'SUCCESS',
      order: {
        coupon: null,
        currency: 'USD',
        discount: null,
        gift_card: null,
        line_items: [
          {
            name: 'Handmade Fabric Face Masks',
            quantity: 1,
            unit_price: null,
            product_id: null,
            color: null,
            size: null,
            url: `https://www.etsy.com/your/purchases/claim?
            token=NTY5ODI4NDg4fDIyOTA5MTI2NDY%3D&signature=i4Go3j75LPZBBPGxzR3Bp2QLHQAq3RXb9cUlaVnZF9Q%3D
            &campaign_label=proteus_transaction_guest_buyer_notification_v2&utm_source=transactional
            &utm_campaign=proteus_transaction_buyer_notification_010170_239793797795_0_0&utm_medium=email
            &from_email=order_confirmation&utm_content=&email_sent=1638674203&euid=AeIyt8YcvsBBW_FAG5JZZEydQ_u0
            &eaid=36678400514&x_eaid=61c3f1b72d&link_clicked=4`,
            product_image_uri:
              'https://i.etsystatic.com/7120425/r/il/821aa3/2792420144/il_340x270.2792420144_7dou.jpg',
          },
          {
            name: 'Handmade NHL Scrunchie',
            quantity: 1,
            unit_price: null,
            product_id: null,
            color: null,
            size: null,
            url: `https://www.etsy.com/your/purchases/claim?token=NTY5ODI4NDg4fDIyOTA5MTI2NDY%3D
            &signature=i4Go3j75LPZBBPGxzR3Bp2QLHQAq3RXb9cUlaVnZF9Q%3D&campaign_label=proteus_transaction_guest_buyer_notification_v2
            &utm_source=transactional&utm_campaign=proteus_transaction_buyer_notification_010170_239793797795_0_0&utm_medium=email
            &from_email=order_confirmation&utm_content=&email_sent=1638674203&euid=AeIyt8YcvsBBW_FAG5JZZEydQ_u0
            &eaid=36678400514&x_eaid=61c3f1b72d&link_clicked=6`,
            product_image_uri:
              'https://i.etsystatic.com/7120425/r/il/fbf5be/3311186749/il_340x270.3311186749_ppqp.jpg',
          },
        ],
        order_date: '2022-12-05T16:54:20-08:00',
        order_number: '2290912646',
        shipping_total: 1359,
        total_tax_amount: 0,
        total_amount: 3367,
      },
      merchant: {
        name: 'Etsy',
        domain: 'etsy.com',
        tier: null,
      },
      fetched_email_id: 'dw6d7remzj91gb8em8nh41q05',
      email_timestamp: 1670288060000000,
      error: null,
      validation_errors: null,
      metadata: {
        account_id: null,
        grant_id: null,
        application_id: null,
        email_category: null,
        sync_category: null,
        notification_timestamp: null,
        sync_requested_at: null,
        provider: null,
        language: null,
        market: 'US',
        redirect: null,
        memberId: null,
        sender_domain: 'etsy.com',
        message_id: null,
        vendor: 'nylas',
      },
      email_category: 'order_confirmation',
    },
    {
      specversion: '1.0',
      status: 'SUCCESS',
      order: {
        coupon: null,
        currency: 'USD',
        discount: null,
        gift_card: null,
        line_items: [],
        order_date: '2022-12-04T00:00:00-08:00',
        order_number: '701-9291360-9438608',
        shipping_total: null,
        total_tax_amount: null,
        total_amount: 196,
      },
      merchant: {
        name: 'Amazon',
        domain: 'amazon.com',
        tier: null,
      },
      fetched_email_id: 'aapgh1o51qdekvli2hhd7nu41',
      email_timestamp: 1670286411000000,
      error: null,
      validation_errors: null,
      metadata: {
        account_id: null,
        grant_id: null,
        application_id: null,
        email_category: null,
        sync_category: null,
        notification_timestamp: null,
        sync_requested_at: null,
        provider: null,
        language: null,
        market: 'US',
        redirect: null,
        memberId: null,
        sender_domain: 'amazon.com',
        message_id: null,
        vendor: 'nylas',
      },
      email_category: 'order_confirmation',
    },
  ];

  return res.json(mockData);
});

// Before we start our backend, we should whitelist our frontend
// as a redirect URI to ensure the auth completes
nylasClient
  .application({
    redirectUris: [CLIENT_URI],
  })
  .then((applicationDetails) => {
    console.log(
      'Application whitelisted. Application Details: ',
      JSON.stringify(applicationDetails)
    );
  });

// Start listening on port 9000
app.listen(port, () => console.log('App listening on port ' + port));
