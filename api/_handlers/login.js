const { send, handleOptions, readJson, required } = require('../_lib/http');
const { isConfigured, authPasswordLogin, getMemberships } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  if (req.method === 'GET') return send(res, 200, { ok: true, method_hint: 'Use POST with email and password to login.', route: '/api/login' });
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed', allowed: ['POST'] });
  try {
    const body = await readJson(req);
    const email = String(required(body.email, 'Email')).toLowerCase();
    const password = String(required(body.password, 'Password'));
    if (!isConfigured()) {
      return send(res, 200, {
        ok: true,
        mode: 'demo',
        session: { access_token: 'demo-token', user: { id: 'demo-user', email } },
        memberships: [{ restaurant_id: 'demo-restaurant', role: 'owner', restaurants: { id: 'demo-restaurant', name: 'Restaurant Démo', city: 'Dakar' } }]
      });
    }
    const session = await authPasswordLogin(email, password);
    const memberships = await getMemberships(session.user.id);
    send(res, 200, { ok: true, mode: 'supabase', session, memberships });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
