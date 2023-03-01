# Read emails

An implementation with Node Express.

## Requirements

- Node 18.0.0 or later
- Configured .env file

### Checking the Node.js version

To check which Node version you have, run the following command in your terminal:

```bash
node -v
```

If the command doesn't return a version, you probably don't have Node installed.  You can either visit [nodejs.org](https://nodejs.org/en/) to download and set up Node v18 or later on your machine, or if you use a version manager for Node, use it to install Node 18.

The minimum required Node version is `v18.0.0`. As a quick check, try running `node -v` again to confirm the version. You may need to restart your terminal for the changes to take effect.
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