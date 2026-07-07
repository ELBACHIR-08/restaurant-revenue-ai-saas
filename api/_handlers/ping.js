module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify({ ok: true, route: '/api/ping', method: req.method, deployed: true, timestamp: new Date().toISOString() }));
};
