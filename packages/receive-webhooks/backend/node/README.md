# Receive Webhooks with Node

An implementation with Node Express.

## Requirements

- Node 18.0.0 or later (see [checking the Node version](#checking-the-nodejs-version))
- [a .env file with your Quickstart app secrets](#set-up-your-env-file)

## Running this app independently

### Set up your `.env` file

Go to the Nylas Dashboard, and choose the Quickstart Application.

Click **App Settings** to see the `client_id` and `client_secret` for the Quickstart app.

Add these to a `.env` in this directory as in the example below.

```yaml
# Nylas application keys - see https://developer.nylas.com/docs/developer-guide/authentication/authorizing-api-requests/#sdk-authentication
CLIENT_ID=client_id...
CLIENT_SECRET=client_secret...
```

### Install Node dependencies

Run the following command to install the Node dependencies for this sample app.

```bash
npm install
```

The `package.json` in this sample already includes the Nylas package. If you were installing this on your own app, you would add the package as a dependency by running:

`npm install --save nylas`

### Run the backend server locally

Start the backend server.

```bash
npm start
```

Your backend server is now running on `localhost:9000` and you can access the app at `localhost:9000`.

## Registering the local webhook

To register the local webhook, you need to set up a tunnel to your local machine. You can use [ngrok](https://ngrok.com/) or [localtunnel](https://localtunnel.github.io/www/). 

In this example, we'll use localtunnel to set up a tunnel to your local machine.
1. Run `npm run localtunnel` to set up a tunnel to your local machine.
2. Copy the URL that is returned in the terminal. It should look something like `https://[random-string].localtunnel.me` or `https://[random-string].localtunnel.it`.
3. Go to the [Nylas Dashboard](https://dashboard.nylas.com/), and choose the Quickstart Application or your own custom application.
4. Click **Webhooks** on the left sidebar.
5. Click **Create Webhook**.
6. In the **URL** field, paste the URL that you copied in step 2.
7. In the **Triggers** field, select the **message.created** and **message.updated** triggers (or any other triggers you want to test).
8. Click **Create Webhook**.

## Testing the webhook

To test the webhook, you can send an email to the email address associated with your Nylas account. You should see the webhook payload in the terminal where you ran `npm start`.

An example terminal output is shown below:

```bash
Server running on port 9000
Webhook event received:  {
  "deltas": [
    {
      "date": 1680030301,
      "object": "message",
      "type": "message.updated",
      "object_data": {
        "namespace_id": "38yegirywefhd5u7w2izwgo",
        "account_id": "38yegirywefhd5u7w2izwgo",
        "object": "message",
        "attributes": {
          "thread_id": "23yeuewfdipylpf6w"
        },
        "id": "63d33029e3wfhd6nvde2j",
        "metadata": null
      }
    }
  ]
}
```

### Checking the Node.js version

To check which Node version you have, run the following command in your terminal:

```bash
node -v
```

If the command doesn't return a version, you might not have Node installed.

You can go to [nodejs.org](https://nodejs.org/en/) to download and set up Node (`v18.0.0` or later) on your machine. If you use a version manager for Node, use it to install Node 18.

Once you install node, run `node -v` again to confirm the version. You might need to restart your terminal for the changes to take effect.
