import os
import json
import re
from enum import Enum

from utils import mock_db

from flask import Flask
from flask import request
from flask_cors import CORS

from nylas import APIClient
from nylas.server_bindings.flask_binding import FlaskBinding

from nylas.client.restful_models import Webhook
from nylas.services.tunnel import open_webhook_tunnel


class AppPaths(str, Enum):  # define app routes as a string enum
    READ_EVENTS = '/nylas/read-events'
    READ_CALENDARS = '/nylas/read-calendars'
    CREATE_EVENTS = '/nylas/create-events'


# # Initialize an instance of the Nylas SDK using the client credentials
nylas = APIClient(
    os.environ.get("CLIENT_ID"),
    os.environ.get("CLIENT_SECRET"),
)

# set client side URI
CLIENT_URI = os.environ.get(
    "CLIENT_URI") or f'http://localhost:{os.environ.get("PORT") or 3000}'


def exchange_mailbox_token_callback(access_token_obj):
    access_token = access_token_obj['access_token']
    email_address = access_token_obj['email_address']

    print('Access Token was generated for: ' + email_address)

    user = mock_db.db.create_or_update_user(email_address, {
        'access_token': access_token,
        'email_address': email_address
    })

    # return whatever you want to the client here
    return {
        'id': user['id'],
        'emailAddress': user['email_address']
    }


# def account_connected_webhook():
#     def on_message(_ws, message):
#         print('webhook message', message)
#         res = json.loads(message)
#         body = json.loads(res['body'])

#         if body['deltas'][0]['type'] == Webhook.Trigger.ACCOUNT_CONNECTED:
#             print("Webhook trigger received, account connected. Details: {}".format(
#                 body['deltas'][0]['object_data']))

#         if body['deltas'][0]['type'] == Webhook.Trigger.EVENT_CREATED:
#             print("Webhook trigger received, account connected. Details: {}".format(
#                 body['deltas'][0]['object_data']))

#     def on_open(_ws):
#         print("opened UPDATED")

#     def on_error(_ws, err):
#         print("Error found")
#         print(err)

#     open_webhook_tunnel(
#         nylas, {'on_message': on_message, 'on_open': on_open, 'on_error': on_error})


# account_connected_webhook()

flask_app = Flask(__name__)
with flask_app.app_context():
    flask_blueprint = FlaskBinding(
        __name__,
        'python-flask-read-emails',
        nylas,
        ['calendar'],
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

        user = mock_db.db.find_user(auth_headers)
        if not user:
            return 'Unauthorized', 401

        nylas.access_token = user['access_token']


@flask_app.after_request
def after_request(response):
    nylas.access_token = None

    return response


@flask_app.route(AppPaths.CREATE_EVENTS, methods=['POST'])
def create_events():
    request_body = request.get_json()

    calendar_id = request_body['calendarId']
    title = request_body['title']
    description = request_body['description']
    start_time = request_body['startTime']
    end_time = request_body['endTime']
    participants = request_body['participants']

    if not calendar_id or not title or not start_time or not end_time:
        return 'Missing required fields: calendarId, title, starTime or endTime', 400

    event = nylas.events.create()

    event.title = title
    event.description = description
    event.when = {
        'start_time': start_time,
        'end_time': end_time,
    }
    event.calendar_id = calendar_id
    if participants:
        event.participants = [{"email": email}
                              for email in participants.split(", ")]

    event.save(notify_participants=True)

    return event.as_json(enforce_read_only=False)


@flask_app.route(AppPaths.READ_EVENTS, methods=['GET'])
def read_events():
    calendar_id = request.args.get('calendarId')
    starts_after = request.args.get('startsAfter')
    ends_before = request.args.get('endsBefore')
    limit = request.args.get('limit')

    res = nylas.events.where(
        calendar_id=calendar_id,
        starts_after=starts_after,
        ends_before=ends_before,
        limit=int(limit)
    ).all()

    res_json = [item.as_json(enforce_read_only=False) for item in res]

    return res_json


@flask_app.route(AppPaths.READ_CALENDARS, methods=['GET'])
def read_calendars():
    res = nylas.calendars.all()

    res_json = [item.as_json(enforce_read_only=False) for item in res]

    return res_json
