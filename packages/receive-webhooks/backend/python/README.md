# Read email Nylas sample app

A Python implementation with Flask.

## Requirements

- Python 3.7 or later
- [a .env file with your Quickstart app secrets](#set-up-your-env-file)

### Python set up

If you use a `python` backend for your demo application, make sure you have `python 3.7` or later installed. You can check what version you have by running:

```bash
python3 --version
```

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

### Create and activate a new virtual environment

**MacOS / Unix**

```bash
python3 -m venv env
source env/bin/activate
```

**Windows (PowerShell)**

```bash
python3 -m venv env
.\env\Scripts\activate.bat
```

### Install Python dependencies

Run the following command to install the Python dependencies for this sample app.

```bash
pip install -r requirements.txt
```

The `requirements.txt` in this sample already includes the Nylas package. If you were installing this on your own app, you would add the package as a dependency by running `pip install nylas`.

### Export and run the backend server locally

Set your Flask app file, and start the backend server.

**MacOS / Unix**

```bash
export FLASK_APP=server.py
python3 -m flask run --port=9000
```

**Windows (PowerShell)**

```bash
$env:FLASK_APP=server.py
python3 -m flask run --port=9000
```

Your backend server is now running on `localhost:9000` and you can now make API calls, or start a frontend for this sample application to run on top of it.

Start the backend before you start the frontend. You will need two terminal sessions so you can run both at the same time. (See the README file in the `frontend` folder for more information.)


## Registering the local webhook

To register the local webhook, you need to set up a tunnel to your local machine. You can use [ngrok](https://ngrok.com/) or [localtunnel](https://localtunnel.github.io/www/). 

In this example, we'll use localtunnel to set up a tunnel to your local machine.
1. Run `npx localtunnel --port 9000` to set up a tunnel to your local machine (requires node & npm installed).
2. Copy the URL that is returned in the terminal. It should look something like `https://[random-string].localtunnel.me` or `https://[random-string].localtunnel.it`.
3. Go to the [Nylas Dashboard](https://dashboard.nylas.com/), and choose the Quickstart Application or your own custom application.
4. Click **Webhooks** on the left sidebar.
5. Click **Create Webhook**.
6. In the **URL** field, paste the URL that you copied in step 2.
7. In the **Triggers** field, select the **message.created** and **message.updated** triggers (or any other triggers you want to test).
8. Click **Create Webhook**.

## Testing the webhook

To test the webhook, you can send an email to the email address associated with your Nylas account. You should see the webhook payload in the terminal where you started the backend server.

An example terminal output is shown below:

```bash
 * Serving Flask app 'server.py'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:9000
Press CTRL+C to quit
127.0.0.1 - - [28/Mar/2023 16:58:45] "GET / HTTP/1.1" 400 -
127.0.0.1 - - [28/Mar/2023 16:58:51] "GET /?challenge=odvq6xz0naadceq8 HTTP/1.1" 200 -
Webhook event received:  {
  "deltas": [
    {
      "date": 1680037141,
      "object": "message",
      "type": "message.updated",
      "object_data": {
        "namespace_id": "jidfguhbjn3wn5u7w2izwgo",
        "account_id": "jidfguhbjn3wn5u7w2izwgo",
        "object": "message",
        "attributes": {
          "thread_id": "ofdgijbgnstr04n31cs"
        },
        "id": "4pko02i3rjegnf4yw3s",
        "metadata": null
      }
    }
  ]
}
```