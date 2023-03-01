# frozen_string_literal: true

require 'sinatra'
require 'sinatra/cross_origin'
require 'nylas'
require 'dotenv'
require_relative './utils/mock_db'

Dotenv.load('.env', '../../../../.env')

DB = MockDb.new('datastore.json')

# enable CORS
configure do
  enable :cross_origin
end

# explicitly respond to preflight requests
options '*' do
  response.headers['Allow'] = 'HEAD,GET,PUT,POST,DELETE,OPTIONS'

  response.headers['Access-Control-Allow-Headers'] =
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept, Authorization'

  200
end

# The port that the backend server will run on
set :port, 9000

# Initialize the Nylas API client using the client id and secret specified in the .env file
nylas = Nylas::API.new(
  app_id: ENV['NYLAS_CLIENT_ID'],
  app_secret: ENV['NYLAS_CLIENT_SECRET']
)

# Before we start our backend, we should register our frontend
# as a redirect URI to ensure the auth completes
CLIENT_URI = ENV.fetch('CLIENT_URI') { "http://localhost:#{ENV.fetch('PORT', 3000)}" }
updated_application_details = nylas.update_application_details({
                                                                 redirect_uris: [CLIENT_URI]
                                                               })
p "Application registered. Application details: #{updated_application_details.to_h}"

# Run a webhook to receive real-time updates from the Nylas API.
# In this example, webhook open and error events and the messages received from the API are printed to the console.
# First, define the callback for the on_message event
def on_message(delta)
  return unless delta.type == WebhookTrigger::MESSAGE_CREATED || delta.type == WebhookTrigger::ACCOUNT_CONNECTED

  # Process the delta however you like
  # Here we just print it to the console
  p [:delta, delta]
end

# Create, register, and open the webhook tunnel for testing
# Config sets the region, triggers, and callbacks
Thread.new do
  Nylas::Tunnel.open_webhook_tunnel(nylas, {
                                      "region": 'us',
                                      "triggers": [WebhookTrigger::MESSAGE_CREATED, WebhookTrigger::ACCOUNT_CONNECTED],
                                      "on_message": method(:on_message)
                                    })
end

##
# Generates a Nylas Hosted Authentication URL with the given arguments.
# The endpoint also uses the app level constant CLIENT_URI to build the URL.
#
# This endpoint is a POST request and accepts the following parameters:
#
# Request Body:
#     success_url: The URL to redirect the user to after successful authorization.
#     email_address: The email address of the user who is authorizing the app.
#
# Returns the generated authorization URL.
post '/nylas/generate-auth-url' do
  request_body = JSON.parse(request.body.read)

  # Use the SDK method to generate a Nylas Hosted Authentication URL
  auth_url = nylas.authentication_url(
    redirect_uri: CLIENT_URI + request_body['success_url'],
    scopes: ['email.send', 'email.modify'],
    login_hint: request_body['email_address'],
    state: nil
  )

  auth_url
end

##
# Exchanges an authorization code for an access token.
# Once the access token is generated, it can be used to make API calls on behalf of the user.
# For this example, we store the access token in our mock database.
#
# This endpoint is a POST request and accepts the following parameters:
#
# Request Body:
#     token: The authorization code generated by the Nylas Hosted Authentication.
#
# Returns a JSON object with the following information about the user:
#     id: The identifier of the user in the database.
#     emailAddress: The email address of the user.
post '/nylas/exchange-mailbox-token' do
  request_body = JSON.parse(request.body.read)

  # Use the SDK method to exchange our authorization code for an access token with the Nylas API
  access_token_obj = nylas.exchange_code_for_token(request_body['token'], return_full_response: true)

  # process the result and send to client however you want
  access_token = access_token_obj[:access_token]
  email_address = access_token_obj[:email_address]

  puts "Access Token was generated for: #{email_address}"

  user = DB.create_or_update_user(email_address, {
                                    'access_token': access_token,
                                    'email_address': email_address
                                  })

  content_type 'application/json'
  {
    'id': user['id'],
    'emailAddress': user['email_address']
  }.to_json
end

##
# A middleware that checks if the user is authenticated.
# If the user is authenticated, the middlware pass authenticated user along.
# If the user is not authenticated, return a 401 error.
#
# This middleware is used for any endpoint that requires an access token to call the Nylas API.
helpers do
  def protected!
    auth_headers = request.env['HTTP_AUTHORIZATION']
    halt 401, 'Unauthorized' if auth_headers.nil?

    # Find the user in the mock database
    user = DB.find_user(auth_headers)
    halt 401, 'Unauthorized' if user.nil?

    # Return the user if found
    user
  end
end

##
# Sends an email on behalf of the user.
# The endpoint also uses the user's access token to send the email.
#
# This endpoint is POST request and accepts the following parameters:
#
# Request Body:
#     to: The email address of the recipient.
#     subject: The subject of the email.
#     body: The body of the email.
#
# Returns the message object from the Nylas API.
#
# See our docs for more information about the message object.
# https://developer.nylas.com/docs/api/#tag--Messages
post '/nylas/send-email' do
  user = protected!

  #  create a Nylas API client instance using the user's access token
  nylas_instance = nylas.as(user['access_token'])

  request_body = JSON.parse(request.body.read)

  # Use the SDK method to send an email on behalf of the user
  # capture the message object from the response
  message = nylas_instance.send!(
    to: [{ email: request_body['to'] }],
    subject: request_body['subject'],
    body: request_body['body']
  )

  # return the message object to the client
  content_type 'application/json'
  message.to_json
end
