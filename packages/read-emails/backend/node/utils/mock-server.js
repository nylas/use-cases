const http = require('http');

const routes = {};

const getReqBody = (req) => {
  return new Promise((resolve, reject) => {
    try {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

const mockServer = {
  get: (path, callback) => {
    mockServer.register('GET', path, callback);
  },
  post: (path, callback) => {
    mockServer.register('POST', path, callback);
  },
  put: (path, callback) => {
    mockServer.register('PUT', path, callback);
  },
  delete: (path, callback) => {
    mockServer.register('DELETE', path, callback);
  },
  register: (method, path, callback) => {
    if (!routes[path]) {
      routes[path] = {};
    }

    routes[path][method] = callback;
  },
  init: () =>
    http.createServer(async (req, res) => {
      // Add cors support
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, content-type',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
        'Access-Control-Max-Age': 2592000,
      };

      // For pre-flight CORS check
      if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        res.end();
        return;
      }

      // Add to enable cors on subsequent calls
      res.setHeader('Access-Control-Allow-Origin', '*');

      const path = req.url.split('?')[0];

      if (routes[path] && routes[path][req.method]) {
        routes[path][req.method](req, res);
      } else if (routes[path]) {
        res.writeHead(405, 'Method not supported.');
        res.end();
      } else {
        res.writeHead(404, 'Not found.');
        res.end();
      }
    }),
};

module.exports = { mockServer, getReqBody };
