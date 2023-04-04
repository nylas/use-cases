<a href="https://www.nylas.com/">
    <img src="https://brand.nylas.com/assets/downloads/logo_horizontal_png/Nylas-Logo-Horizontal-Blue_.png" alt="Aimeos logo" title="Aimeos" align="right" height="60" />
</a>

# Nylas Use Case Samples

**⚠️ Warning: This repo is still in the alpha development stage and stability is not fully guaranteed yet**

Explore working front-end and back-end sample code using an integration with Nylas.

The sample applications redirect to the Nylas hosted authentication page. Once a user authenticates, it allows them to interact with the Nylas APIs from a web client.

Before you get started, head over to your Quickstart Application on the Nylas Dashboard for a copy of your `client id` and `client secret`. You'll need those later in the demo.

## ⚙️ Environment Setup

Let’s check that our environment is set up to use the [Nylas Node SDK](https://github.com/nylas/nylas-nodejs). Check the Node version in your terminal:

```bash
$ node -v
v18.0.0
```

If you don’t see a version returned, you may not have Node installed. Try the following steps:

1. Visit [nodejs.org](https://nodejs.org/en/) to set up Node on your machine
2. _Recommended_: If you happen to use or require multiple versions of Node, consider using [nvm](https://github.com/nvm-sh/nvm)

The minimum required Node version is `v18.0.0`. As a quick check, try running `node -v` again to confirm the version. You may need to restart your terminal for the changes to take effect.

### Python

If choosing a `python` backend for your demo application, please make sure you have `python 3.7` or later installed. Check your installation with:

```
python3 --version
```

### Java

On MacOS, if you experience this error `./gradlew build  # fails due to permission error`, run this command: `chmod 755 gradlew`

## ⚡️ App Set up

View the `README.md` files in the `backend` and `frontend` directories for instructions on how to set up the server and client. These README files include set up instructions for each language.

Start the backend server first, then in a new terminal, start the frontend server.

Once the servers are running, visit the app at [http://localhost:3000](http://localhost:3000). You can also visit the backend server at [http://localhost:9000](http://localhost:9000).

## 💙 Contributing

Interested in contributing to the Nylas use cases project? Thanks so much for your interest! We are always looking for improvements to the project and contributions from open-source developers are greatly appreciated.

Please refer to [Contributing](CONTRIBUTING.md) for information about how to make contributions to this project. We welcome questions, bug reports, and pull requests.

## 📝 License

This project is licensed under the terms of the MIT license. Please refer to [LICENSE](LICENSE.txt) for the full terms.
