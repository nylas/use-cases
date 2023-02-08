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

# Before we start our backend, we should whitelist our frontend
# as a redirect URI to ensure the auth completes
CLIENT_URI = ENV.fetch('CLIENT_URI') { "http://localhost:#{ENV.fetch('PORT', 3000)}" }
updated_application_details = nylas.update_application_details({
                                                                 redirect_uris: [CLIENT_URI]
                                                               })
p "Application whitelisted. Application details: #{updated_application_details.to_h}"

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
# The endpoint also uses the app level constants CLIENT_URI to build the URL.
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
    scopes: ['calendar'],
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
# Retrieves all events from a calendar.
#
# This endpoint is a GET request and accepts the following parameters:
#
# Query Parameters:
#     calendarId: The ID of the calendar to retrieve events from.
#     startsAfter: The start time of the events to retrieve.
#     endsBefore: The end time of the events to retrieve.
#     limit: The maximum number of events to retrieve.
#
# Returns a JSON array of all events from the given calendar.
# See our docs for more information on the Event object.
# https://developer.nylas.com/docs/api/#tag--Events
get '/nylas/read-events' do
  user = protected!

  # create a Nylas API client using the user's access token
  nylas_instance = nylas.as(user['access_token'])

  calendar_id = params['calendarId']
  starts_after = params['startsAfter']
  ends_before = params['endsBefore']
  limit = params['limit']

  # Use the SDK method chaining to retrieve all events from the given calendar
  res = nylas_instance.events.where(
    limit: limit,
    calendar_id: calendar_id,
    starts_after: starts_after,
    ends_before: ends_before
  )
  res_json = res.map { |event| event }.to_json

  content_type 'application/json'
  res_json
end


##
# Retrieves all calendars for the authenticated user.
#
# This endpoint is a GET request and accepts no parameters.
#
# Returns a JSON array of all calendars for the authenticated user.
# See our docs for more information about the calendar object.
# https://developer.nylas.com/docs/api/#tag--Calendar
get '/nylas/read-calendars' do
  user = protected!

  # create a Nylas API client instance using the user's access token
  nylas_instance = nylas.as(user['access_token'])

  # returns all calendars for the authenticated user by default
  res = nylas_instance.calendars
  res_json = res.map { |calendar| calendar }.to_json

  content_type 'application/json'
  res_json
end

##
# Creates an event in the authenticated user's calendar.
#
# This endpoint is a POST request and accepts the following parameters in the request body:
#
# Request Body:
#     calendarId: The identifier of the calendar to create the event in.
#     title: The title of the event.
#     description: The description of the event.
#     startTime: The start time of the event.
#     endTime: The end time of the event.
#     participants: A comma separated list of email addresses of the participants of the event.
#
# Checks if the required parameters are present in the request body.
# Creates an event object and sets the inputted parameters.
# Saves the event object to the Nylas API.
#
# Returns the event object.
# See our docs for more information on the Event object.
# https://developer.nylas.com/docs/api/#tag--Events
post '/nylas/create-events' do
  user = protected!

  # create a Nylas API client instance using the user's access token
  nylas_instance = nylas.as(user['access_token'])

  request_body = JSON.parse(request.body.read)

  if request_body['calendarId'].nil? ||
     request_body['title'].nil? ||
     request_body['startTime'].nil? ||
     request_body['endTime'].nil?
    halt 400,
         'Missing required fields: calendarId, title, starTime or endTime'
  end

  participants = if request_body['participants'].nil?
                   []
                 else
                   request_body['participants'].split(/,\s*/)
                 end

  # use the SDK method to create an event object
  event = nylas_instance.events.create(
    title: request_body['title'],
    description: request_body['description'],
    calendar_id: request_body['calendarId'],
    when: {
      start_time: request_body['startTime'],
      end_time: request_body['endTime']
    },
    participants: participants.map { |email| { email: email } }
  )

  content_type 'application/json'
  event.to_json
end
