# Read emails

An implementation with Flask.

## Requirements

- Python 3.7 or greater
- [Configured .env file](../../../../README.md)

## Running this app independently

1. Confirm `.env` configuration

Head over to your Quickstart Application on the Nylas Dashboard for a copy of your `client_id` and `client_secret`.

Ensure the client_id and client_secret variables are configured in `.env` in this directory.

```yaml
# Nylas application keys - see https://developer.nylas.com/docs/the-basics/authentication/authorizing-api-requests/#sdk-authentication
CLIENT_ID=client_id...
CLIENT_SECRET=client_secret...
```

2. Create and activate a new virtual environment

**MacOS / Unix**

```
python3 -m venv env
source env/bin/activate
```

**Windows (PowerShell)**

```
python3 -m venv env
.\env\Scripts\activate.bat
```

3. Install dependencies

```
pip install -r requirements.txt
```

4. Export and run the application

**MacOS / Unix**

```
export FLASK_APP=app.py
python3 -m flask run --port=9000
```

**Windows (PowerShell)**

```
$env:FLASK_APP=app.py"
python3 -m flask run --port=9000
```

5. Your server is now running on `localhost:9000`! Make API calls from the front end demo application.
