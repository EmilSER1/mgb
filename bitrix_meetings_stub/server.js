const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const MOCK_FILE = path.join(__dirname, 'mock-data.json');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readMockPayload() {
  const raw = fs.readFileSync(MOCK_FILE, 'utf-8');
  const payload = JSON.parse(raw);

  return {
    ...payload,
    generatedAt: new Date().toISOString(),
    summary: {
      totalMeetings: payload.stats.reduce((sum, item) => sum + item.meetingsCount, 0),
      activeEmployees: payload.stats.length,
    },
  };
}

function serveStaticFile(res, filepath) {
  if (!filepath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filepath) || fs.statSync(filepath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filepath);
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filepath).pipe(res);
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && reqUrl.pathname === '/api/meetings/today') {
    try {
      const payload = readMockPayload();
      sendJson(res, 200, payload);
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to read mock data',
      });
      return;
    }
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const requestedPath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  const filepath = path.join(PUBLIC_DIR, requestedPath);
  serveStaticFile(res, filepath);
});

server.listen(PORT, () => {
  console.log(`Stub server running on http://localhost:${PORT}`);
});
