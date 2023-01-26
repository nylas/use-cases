from io import BytesIO
from http.server import HTTPServer
from nylas import APIClient
from enum import Enum
from server import *
from nylas import APIClient
from nylas.services.routes import DefaultPaths, Routes
from utils import mock_db
from dotenv import load_dotenv
import os

load_dotenv()


hostName = "localhost"
serverPort = 9000

nylas = APIClient(
    os.environ.get("CLIENT_ID"),
    os.environ.get("CLIENT_SECRET"),
)
routes = Routes(nylas)

default_scopes = ['email.read_only', 'calendar', 'email.send', 'email.modify']

client_uri = 'http://localhost:3000'


class AppRoutes(str, Enum):  # define app routes as a string enum
    FILE = '/nylas/file'
    READ_EMAILS = '/nylas/read-emails'
    MESSAGE = '/nylas/message'
    SEND_EMAIL = '/nylas/send-email'
    READ_EVENTS = '/nylas/read-events'
    READ_CALENDARS = '/nylas/read-calendars'
    CREATE_EVENTS = '/nylas/create-events'


cors_config = {
    'origins': [client_uri],
    'methods': ['GET', 'POST', 'OPTIONS'],
    'headers': ['Content-Type', 'Authorization', 'Referer'],
    'credentials': 'true'
}
app = MyServer((hostName, serverPort), cors_config)


def is_authenticated(func):
    def wrapper(*args, **kwargs):
        auth_headers = app.req['headers'].get('Authorization')
        if not auth_headers:
            return 401

        user = mock_db.db.find_user(auth_headers)
        if not user:
            return 401

        nylas.access_token = user['access_token']

        app.ctx['user'] = user

        return func
    return wrapper


@app.register_after_request
def remove_access_token(response):
    print('Removing Nylas access token')
    nylas.access_token = None
    return response


@app.route(DefaultPaths.BUILD_AUTH_URL, methods=['POST'])
def build_auth_url():
    request_body = app.req['body']

    auth_url = routes.build_auth_url(
        default_scopes,
        request_body["email_address"],
        request_body["success_url"],
        client_uri=client_uri,
    )

    # this is a string, not a json object
    return auth_url


def exchange_mailbox_token_callback(access_token_obj):
    access_token = access_token_obj['access_token']
    email_address = access_token_obj['email_address']

    print('Access Token was generated for: ' + email_address)

    user = mock_db.db.create_or_update_user(email_address, {
        'access_token': access_token,
        'email_address': email_address
    })

    return {
        'id': user['id'],
        'emailAddress': user['email_address']
    }


@app.route(DefaultPaths.EXCHANGE_CODE_FOR_TOKEN, methods=['POST'])
def exchange_code_for_token():

    access_token_obj = routes.exchange_code_for_token(
        app.req['body']["token"])

    # this is a json object
    return exchange_mailbox_token_callback(access_token_obj)


@app.route(AppRoutes.CREATE_EVENTS, methods=['POST'])
@is_authenticated
def create_event():
    request_body = app.req['body']

    calendar_id = request_body['calendarId']
    title = request_body['title']
    description = request_body['description']
    start_time = request_body['startTime']
    end_time = request_body['endTime']
    participants = request_body['participants']

    if not calendar_id or not title or not start_time or not end_time:
        app.send_error(400)
        app.wfile.write(bytes(
            'Missing required fields: calendarId, title, starTime or endTime', "utf-8"))
        return

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


@app.route(AppRoutes.SEND_EMAIL, methods=['POST'])
@is_authenticated
def send_email():
    authed_user = app.ctx['authed_user']

    request_body = app.req['body']

    to = request_body['to']
    body = request_body['body']
    subject = request_body['subject']

    draft = nylas.drafts.create()
    draft['to'] = [{'email': to}]
    draft['body'] = body
    draft['subject'] = subject
    draft['from'] = [{'email': authed_user['email_address']}]

    message = draft.send()

    return message


@app.route(AppRoutes.READ_EMAILS, methods=['GET'])
@is_authenticated
def read_emails():
    res = nylas.threads.where(limit=20, view="expanded").all()
    res_json = [item.as_json(enforce_read_only=False)
                for item in res]

    # TODO: remove these hack
    for item in res_json:
        item['messages'] = item.pop('_messages')

    for item in res_json:
        item['labels'] = item.pop('_labels')

    return res_json


@app.route(AppRoutes.READ_EVENTS, methods=['GET'])
@is_authenticated
def read_events():
    query_params = app.req['query']

    calendar_id = query_params['calendarId'][0]
    starts_after = query_params['startsAfter'][0]
    ends_before = query_params['endsBefore'][0]
    limit = query_params['limit'][0]

    res = nylas.events.where(
        calendar_id=calendar_id,
        starts_after=starts_after,
        ends_before=ends_before,
        limit=int(limit)
    ).all()

    res_json = [item.as_json(enforce_read_only=False)
                for item in res]

    return res_json


@app.route(AppRoutes.READ_CALENDARS, methods=['GET'])
@is_authenticated
def read_calendars():
    res = nylas.calendars.all()
    res_json = [item.as_json(enforce_read_only=False)
                for item in res]

    return res_json


@app.route(AppRoutes.FILE, methods=['GET'])
@is_authenticated
def get_file():
    query_params = app.req['query']

    file_id = query_params['id'][0]
    file_metadata = nylas.files.get(file_id)
    file = file_metadata.download()

    return app.send_file(file=BytesIO(file).getvalue(),
                         content_type=file_metadata.content_type,
                         as_attachment=True,
                         filename=file_metadata.filename,
                         size=file_metadata.size)


@app.route(AppRoutes.MESSAGE, methods=['GET'])
@is_authenticated
def get_message():
    query_params = app.req['query']

    message_id = query_params['id'][0]
    message = nylas.messages.where(view="expanded").get(message_id)

    return message.as_json(enforce_read_only=False)


if __name__ == '__main__':
    try:
        print("Server started http://%s:%s" % (hostName, serverPort))
        app.serve_forever()
    except KeyboardInterrupt:
        pass

    app.server_close()
    print("Server stopped.")
