# frozen_string_literal: true

require 'sinatra'
require 'sinatra/cross_origin'
require 'nylas'
require 'dotenv'
require_relative './utils/mock_db'

Dotenv.load('.env', '../../../../.env')

DB = MockDb.new('datastore.json')

set :port, 9000

CLIENT_URI = ENV.fetch('CLIENT_URI') { "http://localhost:#{ENV.fetch('PORT', 3000)}" }
DEFAULT_SCOPES = ['email.read_only', 'email.send', 'email.modify', 'calendar'].freeze

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

nylas = Nylas::API.new(
  app_id: ENV['NYLAS_CLIENT_ID'],
  app_secret: ENV['NYLAS_CLIENT_SECRET']
)

updated_application_details = nylas.update_application_details({
                                                                 redirect_uris: [CLIENT_URI]
                                                               })
p "Application whitelisted. Application details: #{updated_application_details.to_h}"

# Define the callback for the on_message event
def on_message(delta)
  if delta.type == WebhookTrigger::MESSAGE_CREATED || delta.type == WebhookTrigger::ACCOUNT_CONNECTED
    p [:delta, delta]
  end
end

# Config that sets the region, triggers, and callbacks
config = {
  "region": 'us',
  "triggers": [WebhookTrigger::MESSAGE_CREATED, WebhookTrigger::ACCOUNT_CONNECTED],
  "on_message": method(:on_message)
}

# Create, register, and open the webhook tunnel for testing
Thread.new do
  Nylas::Tunnel.open_webhook_tunnel(nylas, config)
end

post '/nylas/generate-auth-url' do
  request_body = JSON.parse(request.body.read)
  auth_url = nylas.authentication_url(
    redirect_uri: CLIENT_URI + request_body['success_url'],
    scopes: DEFAULT_SCOPES,
    login_hint: request_body['email_address'],
    state: nil
  )

  auth_url
end

post '/nylas/exchange-mailbox-token' do
  request_body = JSON.parse(request.body.read)

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

helpers do
  def protected!
    auth_headers = request.env['HTTP_AUTHORIZATION']
    halt 401, 'Unauthorized' if auth_headers.nil?

    user = DB.find_user(auth_headers)
    halt 401, 'Unauthorized' if user.nil?

    user
  end
end

get '/nylas/read-emails' do
  user = protected!
  nylas_instance = nylas.as(user['access_token'])

  res = nylas_instance.threads.expanded.limit(10)
  res_json = res.map { |thread| thread }.to_json

  content_type 'application/json'
  res_json
end

get '/nylas/message' do
  user = protected!
  nylas_instance = nylas.as(user['access_token'])

  message = nylas_instance.messages.expanded.find(params['id'])

  content_type 'application/json'
  message.to_json
end

get '/nylas/file' do
  user = protected!
  nylas_instance = nylas.as(user['access_token'])

  attachment

  f = nylas_instance.files.find(params['id'])

  f.download
end

post '/nylas/send-email' do
  user = protected!
  nylas_instance = nylas.as(user['access_token'])

  request_body = JSON.parse(request.body.read)

  draft = nylas_instance.drafts.create(
    to: [{ email: request_body['to'] }],
    subject: request_body['subject'],
    body: request_body['body']
  )
  message = draft.send!

  content_type 'application/json'
  message.to_json
end
