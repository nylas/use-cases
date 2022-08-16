# Nylas Use Case Samples

Explore working front-end and back-end sample code using an integration with Nylas.

The sample application redirects to a prebuilt authentication page hosted on Nylas, then allows that authenticated user to interact with Nylas API from a web client.

Before you get started, head over to your Quickstart Application on the Nylas Dashboard for a copy of your `client id` and `client secret`. You'll need those later in the demo.

## Setup

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
