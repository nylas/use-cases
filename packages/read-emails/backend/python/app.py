import json
import os
from io import BytesIO


from dotenv import load_dotenv

from http.server import BaseHTTPRequestHandler, HTTPServer
from enum import Enum
from urllib.parse import urlparse, parse_qs

from utils import mock_db

from nylas import APIClient
from nylas.services.routes import DefaultPaths, Routes

load_dotenv()

nylas = APIClient(
    os.environ.get("CLIENT_ID"),
    os.environ.get("CLIENT_SECRET"),
)
routes = Routes(nylas)

hostName = "localhost"
serverPort = 9000
client_uri = 'http://localhost:3000'
default_scopes = ['email.read_only', 'calendar', 'email.send', 'email.modify']


# TODO: set content length headers

class AppRoutes(str, Enum):  # define app routes as a string enum
    FILE = '/nylas/file'
    READ_EMAILS = '/nylas/read-emails'
    MESSAGE = '/nylas/message'
    SEND_EMAIL = '/nylas/send-email'
    READ_EVENTS = '/nylas/read-events'
    READ_CALENDARS = '/nylas/read-calendars'
    CREATE_EVENTS = '/nylas/create-events'


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


class MyServer(BaseHTTPRequestHandler):
    def is_authenticated(self):
        auth_headers = self.headers.get('Authorization')
        if not auth_headers:
            self.send_error(401)
            self.wfile.write(bytes('Unauthorized', "utf-8"))
            return False

        user = mock_db.db.find_user(auth_headers)
        if not user:
            self.send_error(401)
            self.wfile.write(bytes('Unauthorized', "utf-8"))
            return False

        nylas.access_token = user['access_token']
        return user

    def is_valid_route(self):
        parsed_url = urlparse(self.path)
        if not parsed_url.path in [route.value for route in AppRoutes]:
            self.send_error(404)
            self.wfile.write(bytes('Not Found', "utf-8"))
            return False
        return parsed_url

    def end_headers(self):
        # enable cors
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', client_uri)
        self.send_header("Access-Control-Allow-Headers",
                         "Content-Type, Referer, Authorization")
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        return super(MyServer, self).end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == DefaultPaths.BUILD_AUTH_URL:
            length = int(self.headers.get('content-length'))
            message = json.loads(self.rfile.read(length))

            auth_url = routes.build_auth_url(
                default_scopes,
                message["email_address"],
                message["success_url"],
                client_uri=client_uri,
            )

            print(auth_url)

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(bytes(auth_url, "utf-8"))
            return

        if self.path == DefaultPaths.EXCHANGE_CODE_FOR_TOKEN:
            length = int(self.headers.get('content-length'))
            message = json.loads(self.rfile.read(length))

            access_token = routes.exchange_code_for_token(message["token"])

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(
                bytes(json.dumps(exchange_mailbox_token_callback(access_token)), "utf-8"))
            return

        parsed_url = self.is_valid_route()
        if not parsed_url:
            return

        authed_user = self.is_authenticated()
        if not authed_user:
            return

        if parsed_url.path == AppRoutes.CREATE_EVENTS:
            content_len = int(self.headers.get('Content-Length'))
            request_body = json.loads(self.rfile.read(content_len))

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

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(
                bytes(json.dumps(event.as_json(enforce_read_only=False)), "utf-8"))

        if parsed_url.path == AppRoutes.SEND_EMAIL:
            nylas.access_token = authed_user['access_token']

            content_len = int(self.headers.get('Content-Length'))
            request_body = json.loads(self.rfile.read(content_len))

            to = request_body['to']
            body = request_body['body']
            subject = request_body['subject']

            draft = nylas.drafts.create()
            draft['to'] = [{'email': to}]
            draft['body'] = body
            draft['subject'] = subject
            draft['from'] = [{'email': authed_user['email_address']}]

            message = draft.send()

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(bytes(json.dumps(message), "utf-8"))

        nylas.access_token = None

    def do_GET(self):
        parsed_url = self.is_valid_route()
        if not parsed_url:
            return

        if not self.is_authenticated():
            return

        if parsed_url.path == AppRoutes.READ_EMAILS:
            res = nylas.threads.where(limit=20, view="expanded").all()
            res_json = [item.as_json(enforce_read_only=False) for item in res]

            # TODO: remove these hack
            for item in res_json:
                item['messages'] = item.pop('_messages')

            for item in res_json:
                item['labels'] = item.pop('_labels')

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(bytes(json.dumps(res_json), "utf-8"))

        if parsed_url.path == AppRoutes.READ_EVENTS:
            qs = parsed_url.query
            parsed_qs = parse_qs(qs)

            calendar_id = parsed_qs['calendarId'][0]
            starts_after = parsed_qs['startsAfter'][0]
            ends_before = parsed_qs['endsBefore'][0]
            limit = parsed_qs['limit'][0]

            res = nylas.events.where(
                calendar_id=calendar_id,
                starts_after=starts_after,
                ends_before=ends_before,
                limit=int(limit)
            ).all()

            res_json = [item.as_json(enforce_read_only=False) for item in res]

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(bytes(json.dumps(res_json), "utf-8"))

        if parsed_url.path == AppRoutes.READ_CALENDARS:
            res = nylas.calendars.all()
            res_json = [item.as_json(enforce_read_only=False) for item in res]

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(bytes(json.dumps(res_json), "utf-8"))

        if parsed_url.path == AppRoutes.FILE:
            qs = parsed_url.query
            parsed_qs = parse_qs(qs)

            file_id = parsed_qs['id'][0]
            file_metadata = nylas.files.get(file_id)
            file = file_metadata.download()

            self.send_response(200)
            self.send_header("Content-Type", file_metadata.content_type)
            self.send_header("Content-Disposition",
                             "attachment; filename=%s" % file_metadata.filename)
            self.send_header("Content-Length", file_metadata.size)
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            self.wfile.write(BytesIO(file).getvalue())

        if parsed_url.path == AppRoutes.MESSAGE:
            qs = parsed_url.query
            parsed_qs = parse_qs(qs)

            message_id = parsed_qs['id'][0]
            message = nylas.messages.where(view="expanded").get(message_id)

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            self.wfile.write(
                bytes(json.dumps(message.as_json(enforce_read_only=False)), "utf-8"))

        nylas.access_token = None


if __name__ == "__main__":
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
