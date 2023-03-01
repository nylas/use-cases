# Read email Nylas sample app

A Ruby implementation with [Sinatra](http://sinatrarb.com/).

## Requirements

- Ruby 3.0 or later (Mac users [see here for more info](#troubleshooting-for-mac-users))
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

### Install Ruby dependencies

Run the following command to install the Ruby dependencies for this sample app.

```bash
bundle install
```

The `Gemfile` in this sample already includes the Nylas package. If you were installing this on your own app, you would add the package as a dependency by running:

`gem install nylas`

### Run the backend server locally

Start the backend server before you start the frontend. You will need two terminal sessions so you can run both at the same time.

```bash
ruby server.rb
```

Your backend server is now running on `localhost:9000` and you can now make API calls, or start a frontend for this sample application to run on top of it.
(See the README file in the `frontend` folder for more information.)

## Troubleshooting for Mac users

Apple's macOS includes an older version (2.6x) of Ruby that's used for system operations, and which can't be easily modified. If you're using a Mac, you should install a Ruby Version Manager such as [RVM](https://rvm.io/) or [Frum](https://github.com/TaKO8Ki/frum) so you can install a separate Ruby version, and switch between versions easily.

To check which version of Ruby you have installed, run `ruby -v`.
If the output is a version of 2.6, you should install a separate Ruby version later than 3.0.
