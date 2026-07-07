function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-restaurant-id');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(data));
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return true;
  }
  return false;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch (error) {
    const e = new Error('Invalid JSON body');
    e.statusCode = 400;
    throw e;
  }
}

function getBearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function required(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    const e = new Error(`${label} is required`);
    e.statusCode = 400;
    throw e;
  }
  return value;
}

module.exports = { send, handleOptions, readJson, getBearer, required };
