import os
from enum import Enum

from utils.mock_db import MockDb

from io import BytesIO

from flask import Flask
from flask import request
from flask import send_file
from flask_cors import CORS

from nylas import APIClient
from nylas.server_bindings.flask_binding import FlaskBinding

# TODO: implement webhooks
# from nylas.client.restful_models import Webhook
# from nylas.services.tunnel import open_webhook_tunnel


class AppPaths(str, Enum):  # define app routes as a string enum
    FILE = '/nylas/file'
    READ_EMAILS = '/nylas/read-emails'
    MESSAGE = '/nylas/message'


# # Initialize an instance of the Nylas SDK using the client credentials
nylas = APIClient(
    os.environ.get("CLIENT_ID"),
    os.environ.get("CLIENT_SECRET"),
)

# set client side URI
CLIENT_URI = os.environ.get(
    "CLIENT_URI") or f'http://localhost:{os.environ.get("PORT") or 3000}'

# TODO: initialize elsewhere?
# spin up mock db
mock_db = MockDb('datastore.json')


def exchange_mailbox_token_callback(access_token_obj):
    access_token = access_token_obj['access_token']
    email_address = access_token_obj['email_address']

    print('Access Token was generated for: ' + email_address)

    user = mock_db.create_or_update_user(email_address, {
        'access_token': access_token,
        'email_address': email_address
    })

    # return whatever you want to the client here
    return {
        'id': user['id'],
        'emailAddress': user['email_address']
    }


flask_app = Flask(__name__)
with flask_app.app_context():
    flask_blueprint = FlaskBinding(
        __name__,
        'python-flask-read-emails',
        nylas,
        ['email.read_only'],
        exchange_mailbox_token_callback,
        CLIENT_URI,
    ).build()
flask_app.register_blueprint(flask_blueprint)


CORS(flask_app, supports_credentials=True)


@flask_app.before_request
def before_request():
    if request.method != 'OPTIONS':  # skip preflight requests
        if not request.path in [path.value for path in AppPaths]:
            return

        auth_headers = request.headers.get('Authorization')
        if not auth_headers:
            return 'Unauthorized', 401

        user = mock_db.find_user(auth_headers)
        if not user:
            return 'Unauthorized', 401

        nylas.access_token = user['access_token']


@flask_app.after_request
def after_request(response):
    nylas.access_token = None

    return response


@flask_app.route(AppPaths.READ_EMAILS, methods=['GET'])
def read_emails():
    res = nylas.threads.where(limit=10, view="expanded").all()
    res_json = [item.as_json(enforce_read_only=False) for item in res]

    # TODO: remove these hack
    for item in res_json:
        item['messages'] = item.pop('_messages')

    for item in res_json:
        item['labels'] = item.pop('_labels')

    return res_json


@flask_app.route(AppPaths.MESSAGE, methods=['GET'])
def get_message():
    message_id = request.args.get('id')
    message = nylas.messages.where(view="expanded").get(message_id)

    return message.as_json(enforce_read_only=False)


@flask_app.route(AppPaths.FILE, methods=['GET'])
def download_file():
    # TODO: fix
    file_id = request.args.get('id')
    file_metadata = nylas.files.get(file_id)

    file = file_metadata.download()

    print(file_metadata.filename)

    return send_file(BytesIO(file), download_name=file_metadata.filename, mimetype=file_metadata.content_type)
