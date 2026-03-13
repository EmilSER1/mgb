const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const MOCK_FILE = path.join(__dirname, 'mock-data.json');
const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL || '';
const BITRIX_MEETING_STAGE_ID = process.env.BITRIX_MEETING_STAGE_ID || '';
const USE_MOCK = String(process.env.USE_MOCK || 'true').toLowerCase() === 'true';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function loadEnv(filepath) {
  if (!fs.existsSync(filepath)) return;

  const rows = fs.readFileSync(filepath, 'utf-8').split(/\r?\n/);
  for (const row of rows) {
    const line = row.trim();
    if (!line || line.startsWith('#')) continue;

    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readMockPayload() {
  const raw = fs.readFileSync(MOCK_FILE, 'utf-8');
  const payload = JSON.parse(raw);

  return normalizePayload(payload.stats || []);
}

function normalizePayload(stats) {
  const sorted = [...stats].sort((a, b) => b.meetingsCount - a.meetingsCount);
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMeetings: sorted.reduce((sum, item) => sum + item.meetingsCount, 0),
      activeEmployees: sorted.length,
    },
    stats: sorted,
  };
}

function localDayBoundaries() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function bitrixPost(methodPath, body) {
  if (!BITRIX_WEBHOOK_URL) {
    throw new Error('BITRIX_WEBHOOK_URL is missing');
  }

  const endpoint = `${BITRIX_WEBHOOK_URL.replace(/\/$/, '')}/${methodPath}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Bitrix HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error_description || payload.error);
  }

  return payload.result || [];
}

async function getBitrixPayload() {
  if (!BITRIX_MEETING_STAGE_ID) {
    throw new Error('BITRIX_MEETING_STAGE_ID is missing');
  }

  const { start, end } = localDayBoundaries();

  const deals = await bitrixPost('crm.deal.list', {
    filter: {
      STAGE_ID: BITRIX_MEETING_STAGE_ID,
      '>=DATE_MODIFY': start,
      '<=DATE_MODIFY': end,
    },
    select: ['ID', 'ASSIGNED_BY_ID'],
  });

  const counters = new Map();
  for (const deal of deals) {
    const employeeId = deal.ASSIGNED_BY_ID;
    if (!employeeId) continue;
    counters.set(employeeId, (counters.get(employeeId) || 0) + 1);
  }

  const employeeIds = Array.from(counters.keys());
  if (!employeeIds.length) return normalizePayload([]);

  const users = await bitrixPost('user.get', { FILTER: { ID: employeeIds } });
  const usersMap = new Map(users.map((user) => [String(user.ID), user]));

  const stats = employeeIds.map((id) => {
    const user = usersMap.get(String(id));
    const name = [user?.LAST_NAME, user?.NAME].filter(Boolean).join(' ').trim() || `Сотрудник #${id}`;

    return {
      employeeId: String(id),
      employeeName: name,
      position: user?.WORK_POSITION || 'Оператор',
      meetingsCount: counters.get(id) || 0,
    };
  });

  return normalizePayload(stats);
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

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && reqUrl.pathname === '/api/meetings/today') {
    try {
      const payload = USE_MOCK ? readMockPayload() : await getBitrixPayload();
      sendJson(res, 200, payload);
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to load meetings data',
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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mode: ${USE_MOCK ? 'mock' : 'bitrix'}`);
});
