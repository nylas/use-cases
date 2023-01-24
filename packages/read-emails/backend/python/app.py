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
default_scopes = ['email.read_only']


class AppRoutes(str, Enum):  # define app routes as a string enum
    FILE = '/nylas/file'
    READ_EMAILS = '/nylas/read-emails'
    MESSAGE = '/nylas/message'
    SEND_EMAIL = '/nylas/send-email'


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

    def end_headers(self):
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

        if self.path == DefaultPaths.EXCHANGE_CODE_FOR_TOKEN:
            length = int(self.headers.get('content-length'))
            message = json.loads(self.rfile.read(length))

            access_token = routes.exchange_code_for_token(message["token"])

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(
                bytes(json.dumps(exchange_mailbox_token_callback(access_token)), "utf-8"))

        if self.path == AppRoutes.SEND_EMAIL:
            auth_headers = self.headers.get('Authorization')
            if not auth_headers:
                return 'Unauthorized', 401

            user = mock_db.db.find_user(auth_headers)

            if not user:
                return 'Unauthorized', 401

            nylas.access_token = user['access_token']

            # make sure content length header is set
            content_len = int(self.headers.get('Content-Length'))
            request_body = json.loads(self.rfile.read(content_len))

            to = request_body['to']
            body = request_body['body']
            subject = request_body['subject']

            draft = nylas.drafts.create()
            draft['to'] = [{'email': to}]
            draft['body'] = body
            draft['subject'] = subject
            draft['from'] = [{'email': user['email_address']}]

            message = draft.send()

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(bytes(message, "utf-8"))

            nylas.access_token = None

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
        path = parsed_url.path
        if not urlparse(self.path).path in [route.value for route in AppRoutes]:
            self.send_error(404)
            self.wfile.write(bytes('Not Found', "utf-8"))
            return False
        return path

    def do_GET(self):
        valid_path = self.is_valid_route()
        if not valid_path:
            return

        if not self.is_authenticated():
            return

        if valid_path == AppRoutes.READ_EMAILS:
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

        if valid_path == AppRoutes.FILE:
            qs = urlparse(self.path).query
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

        if valid_path == AppRoutes.MESSAGE:
            qs = urlparse(self.path).query
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
