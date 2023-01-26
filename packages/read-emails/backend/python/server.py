import json

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


def func_nester_helper(new_func, old_func):
    def nested_func(*args, **kwargs):
        if old_func:
            return new_func(old_func(*args, **kwargs))
        else:
            return new_func(*args, **kwargs)
    return nested_func


def run_command(endpoint_func):
    res = endpoint_func()
    if hasattr(res, '__call__'):
        return run_command(res)
    return res


http_method_map = {
    'GET': {},
    'POST': {},
    'PUT': {},
    'PATCH': {},
    'DELETE': {}
}


class MyServer(HTTPServer):
    def __init__(self, server_address, cors_config):
        self.url_map = http_method_map
        self.req = {}
        self.ctx = {}
        self.pre_request_func = None
        self.after_request_func = None
        self.cors_config = cors_config

        super(MyServer, self).__init__(server_address, MyHandler)

    def route(self, route, methods):
        def register_endpoint(func):
            for method in methods:
                self.url_map[method][route] = func
            return func
        return register_endpoint

    def register_after_request(self, func):
        self.after_request_func = func_nester_helper(
            func, self.after_request_func)

    def register_pre_request(self, func):
        self.pre_request_func = func_nester_helper(
            func, self.pre_request_func)


class MyHandler(BaseHTTPRequestHandler):

    def pre_request(func):
        def wrapper(self, *args, **kwargs):
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)

            # naive implementation that assumes all request bodies are json if they have a content length
            body = {}
            if self.headers['Content-Length']:
                body = json.loads(self.rfile.read(
                    int(self.headers['Content-Length'])))

            request = {
                'endpoint': parsed_url.path,
                'query': query_params,
                'headers': self.headers,
                'body': body
            }

            self.server.req = request

            if self.server.pre_request_func:
                self.server.ctx = self.server.pre_request_func(
                    request, self.server.ctx)

            return func(self, *args, **kwargs)
        return wrapper

    def route_request(method):
        def decorator(func):
            def wrapper(self, *args, **kwargs):
                endpoint_func = self.server.url_map[method][self.server.req['endpoint']]
                if not endpoint_func:
                    self.send_error(404)
                    return

                return func(self, endpoint_func, *args, **kwargs)
            return wrapper
        return decorator

    def after_request(func):
        def wrapper(self, *args, **kwargs):
            if self.server.after_request_func:
                res = self.server.after_request_func(
                    func(self, *args, **kwargs))

            self.process_response(res)
            self.teardown()

        return wrapper

    def send_file(self, file, content_type, as_attachment, filename, size):
        self.send_response(200)

        self.send_header('Content-Type', content_type)
        if as_attachment:
            self.send_header('Content-Disposition',
                             'attachment; filename=' + filename)
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", size)
        self.end_headers()

        return file

    # very naive
    def process_response(self,  res):
        # response is file
        if isinstance(res, bytes):
            self.wfile.write(res)
            return

        self.send_response(200)

        # response is json
        if isinstance(res, dict) or isinstance(res, list):
            res_bytes = bytes(json.dumps(res), "utf-8")

            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", len(res_bytes))
            self.end_headers()

            self.wfile.write(res_bytes)

        # response is text
        if isinstance(res, str):
            res_bytes = bytes(res, "utf-8")

            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", len(res_bytes))
            self.end_headers()

            self.wfile.write(res_bytes)

    def teardown(self):
        self.server.req = {}
        self.server.ctx = {}

    def use_cors(self, cors_config):
        self.send_header('Access-Control-Allow-Credentials',
                         cors_config['credentials'])
        self.send_header('Access-Control-Allow-Origin',
                         ','.join(cors_config['origins']))
        self.send_header("Access-Control-Allow-Headers",
                         ','.join(cors_config['headers']))
        self.send_header('Access-Control-Allow-Methods',
                         ','.join(cors_config['methods']))

    def end_headers(self):
        cors_config = self.server.cors_config
        if cors_config:
            self.use_cors(cors_config)
        return super(MyHandler, self).end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    @ pre_request
    @ route_request('POST')
    @ after_request
    def do_POST(self, endpoint_func):
        return run_command(endpoint_func)

    @ pre_request
    @ route_request('GET')
    @ after_request
    def do_GET(self, endpoint_func):
        return run_command(endpoint_func)
