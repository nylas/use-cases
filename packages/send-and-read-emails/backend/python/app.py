import os
from functools import wraps
import json

from utils.mock_db import db

from io import BytesIO
from flask import Flask, request, send_file, g
from flask_cors import CORS

from nylas import APIClient
from nylas.services.routes import Routes
from nylas.services.tunnel import open_webhook_tunnel


# # Initialize an instance of the Nylas SDK using the client credentials
nylas = APIClient(
    os.environ.get("CLIENT_ID"),
    os.environ.get("CLIENT_SECRET"),
)

routes = Routes(nylas)

# set client side URI
CLIENT_URI = os.environ.get(
    "CLIENT_URI") or f'http://localhost:{os.environ.get("PORT") or 3000}'
DEFAULT_SCOPES = ['email.read_only', 'email.send', 'email.modify']


def run_webhook():
    def on_message(wsapp, message):
        msg = json.loads(message)
        jsn = json.loads(msg['body'])
        delta = jsn['deltas'][0]
        print(delta)

    def on_open(ws):
        print("opened")

    def on_error(ws, err):
        print("Error found")
        print(err)

    open_webhook_tunnel(
        nylas, {'on_message': on_message, 'on_open': on_open, 'on_error': on_error})


run_webhook()

flask_app = Flask(__name__)
CORS(flask_app, supports_credentials=True)


@flask_app.route("/nylas/generate-auth-url", methods=["POST"])
def build_auth_url():
    request_body = request.get_json()
    auth_url = nylas.authentication_url(
        (CLIENT_URI or "") + request_body["success_url"],
        login_hint=request_body["email_address"],
        scopes=DEFAULT_SCOPES,
        state=None,
    )

    return auth_url


@flask_app.route("/nylas/exchange-mailbox-token", methods=["POST"])
def exchange_code_for_token():
    request_body = request.get_json()
    access_token_obj = nylas.send_authorization(request_body["token"])

    # process the result and send to client however you want
    access_token = access_token_obj['access_token']
    email_address = access_token_obj['email_address']

    print('Access Token was generated for: ' + email_address)

    user = db.create_or_update_user(email_address, {
        'access_token': access_token,
        'email_address': email_address
    })

    return {
        'id': user['id'],
        'emailAddress': user['email_address']
    }


def is_authenticated(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        auth_headers = request.headers.get('Authorization')
        if not auth_headers:
            return 401

        user = db.find_user(auth_headers)
        if not user:
            return 401

        nylas.access_token = user['access_token']
        g.user = user

        return f(*args, **kwargs)
    return decorator


@flask_app.after_request
def after_request(response):
    nylas.access_token = None

    return response


@flask_app.route('/nylas/read-emails', methods=['GET'])
@is_authenticated
def read_emails():
    res = nylas.threads.where(limit=20, view="expanded").all()
    res_json = [item.as_json(enforce_read_only=False) for item in res]

    return res_json


@flask_app.route('/nylas/message', methods=['GET'])
@is_authenticated
def get_message():
    message_id = request.args.get('id')
    message = nylas.messages.where(view="expanded").get(message_id)

    return message.as_json(enforce_read_only=False)


@flask_app.route('/nylas/file', methods=['GET'])
@is_authenticated
def download_file():
    file_id = request.args.get('id')
    file_metadata = nylas.files.get(file_id)

    file = file_metadata.download()

    return send_file(BytesIO(file), download_name=file_metadata.filename, mimetype=file_metadata.content_type, as_attachment=True)


@flask_app.route('/nylas/send-email', methods=['POST'])
@is_authenticated
def send_email():
    user = g.user
    request_body = request.get_json()
    draft = nylas.drafts.create()

    draft['to'] = [{'email': request_body['to']}]
    draft['body'] = request_body['body']
    draft['subject'] = request_body['subject']
    draft['from'] = [{'email': user['email_address']}]

    message = draft.send()

    return message
