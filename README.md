<a href="https://www.nylas.com/">
    <img src="https://brand.nylas.com/assets/downloads/logo_horizontal_png/Nylas-Logo-Horizontal-Blue_.png" alt="Aimeos logo" title="Aimeos" align="right" height="60" />
</a>

# Nylas Use Case Samples (⚠️ In Active Development)

Explore working front-end and back-end sample code using an integration with Nylas.

The sample application redirects to a prebuilt authentication page hosted on Nylas, then allows that authenticated user to interact with Nylas API from a web client.

Before you get started, head over to your Quickstart Application on the Nylas Dashboard for a copy of your `client id` and `client secret`. You'll need those later in the demo.

## ⚙️ Environment Setup

Let’s check that our environment is set up to use the [Nylas Node SDK](https://github.com/nylas/nylas-nodejs). Check the Node version in your terminal:

```bash
$ node -v
v18.0.0
```

If you don’t see a version returned, you may not have Node installed. Try the following steps:

1. Visit [nodejs.org](https://nodejs.org/en/) to set up Node on your machine
2. *Recommended*: If you happen to use or require multiple versions of Node, consider using [nvm](https://github.com/nvm-sh/nvm)

The minimum required Node version is `v18.0.0`. As a quick check, try running `node -v` again to confirm the version. You may need to restart your terminal for the changes to take effect.


## ⚡️ App Setup

1. Installation

    ```bash
    git clone nylas-samples@use-cases
                                                                                    
    cd use-cases
    
    npm install

    npm run setup
    ```
    
2. Copy `.env.sample` to `.env` on the root level of the project.
   
3. Fill in the `YOUR_APP_CLIENT_ID` and `YOUR_APP_CLIENT_SECRET` in `.env` file
    
    ```js
    // Nylas application credentials
    YOUR_APP_CLIENT_ID="<YOUR_APP_CLIENT_ID> from the Nylas Dashboard"
    YOUR_APP_CLIENT_SECRET="<YOUR_APP_CLIENT_SECRET> from the Nylas Dashboard"
    ```
    
4. Run code
    
    ```bash
    # in one terminal
    npm start # starts server + opens browser for localhost:3000
              # terminal shows webhook output here
    ```

## 💙 Contributing

Interested in contributing to the Nylas use cases project? Thanks so much for your interest! We are always looking for improvements to the project and contributions from open-source developers are greatly appreciated.

Please refer to [Contributing](CONTRIBUTING.md) for information about how to make contributions to this project. We welcome questions, bug reports, and pull requests.

## 📝License

This project is licensed under the terms of the MIT license. Please refer to [LICENSE](LICENSE.txt) for the full terms.
