# Read emails

An implementation with Node Express.

## Requirements

- Node 18.0.0 or greater
- Configured .env file

## Running this app independently

1. Confirm `.env` configuration

    Head over to your Quickstart Application on the Nylas Dashboard for a copy of your `client_id` and `client_secret`.

    Ensure the client_id and client_secret variables are configured in `.env` in this directory.

    ```yaml
    # Nylas application keys - see https://developer.nylas.com/docs/the-basics/authentication/authorizing-api-requests/#sdk-authentication
    CLIENT_ID=client_id...
    CLIENT_SECRET=client_secret...
    ```

2. Install dependencies

    ```
    npm install
    ```

3. Run the server

    ```
    npm start
    ```
4. Confirm the server is running on [http://localhost:9000](http://localhost:9000).