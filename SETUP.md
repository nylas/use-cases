# Nylas Use Case Samples

**⚠️ Warning: This repo is not meant for use in production and stability is not fully guaranteed.**

Explore working front-end and back-end sample code using an integration with Nylas.

The sample application redirects to Nylas' hosted authentication page. Once authenticated, it allows the user to interact with Nylas' APIs from a web client.

## ⚙️ Environment Setup

Let’s check that our environment is set up to use the [Nylas Use Cases](https://github.com/nylas/use-cases). Check the Node version in your terminal:

```bash
node -v
```

If you don’t see a version returned, you may not have Node installed. Try the following steps:

1. Visit [nodejs.org](https://nodejs.org/en/) to set up Node on your machine

The minimum required Node version is `v18.0.0`. As a quick check, try running `node -v` again to confirm the version. You may need to restart your terminal for the changes to take effect.

### Python

If choosing a `python` backend for your demo application, please make sure you have `python 3.7` or higher installed. Check your installation with:

```
python3 --version
```

## ⚡️ App Setup

View the README.md files in the `backend` and `frontend` directories for instructions on how to set up each server. Start the backend server first, then in a new terminal, start the frontend server.

Once the servers are running, you can visit the app at [http://localhost:3000](http://localhost:3000). You can also visit the backend server at [http://localhost:5000](http://localhost:5000).