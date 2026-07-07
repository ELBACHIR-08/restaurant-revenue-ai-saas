const { send, handleOptions } = require('../_lib/http');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  send(res, 200, {
    ok: true,
    message: 'API routes are deployed',
    routes: [
      '/api/health',
      '/api/config',
      '/api/login',
      '/api/signup',
      '/api/products',
      '/api/promotions',
      '/api/restaurants',
      '/api/admin-summary',
      '/api/admin-restaurants',
      '/api/admin-subscriptions',
      '/api/reports-generate',
      '/api/auth-me'
    ]
  });
};
