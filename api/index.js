const url = require('url');

const handlers = {
  'admin-restaurants': require('./_handlers/admin-restaurants'),
  'admin-subscriptions': require('./_handlers/admin-subscriptions'),
  'admin-summary': require('./_handlers/admin-summary'),
  'auth-me': require('./_handlers/auth-me'),
  'config': require('./_handlers/config'),
  'generate': require('./_handlers/generate'),
  'health': require('./_handlers/health'),
  'login': require('./_handlers/login'),
  'me': require('./_handlers/me'),
  'orders': require('./_handlers/orders'),
  'parse-menu': require('./_handlers/parse-menu'),
  'ping': require('./_handlers/ping'),
  'products': require('./_handlers/products'),
  'promotions': require('./_handlers/promotions'),
  'reports-generate': require('./_handlers/reports-generate'),
  'restaurants': require('./_handlers/restaurants'),
  'routes': require('./_handlers/routes'),
  'signup': require('./_handlers/signup')
};

module.exports = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Extract path parameter passed by vercel.json rewrite: ?_path=...
  const route = parsedUrl.query._path;

  // Clean up the routing parameter from query so handlers don't see it
  if (req.query) {
    delete req.query._path;
  }
  if (parsedUrl.query) {
    delete parsedUrl.query._path;
  }

  const handler = handlers[route];
  if (handler) {
    return handler(req, res);
  }

  // Fallback to 404
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, error: `Route not found: ${parsedUrl.pathname} (route: ${route})` }));
};
