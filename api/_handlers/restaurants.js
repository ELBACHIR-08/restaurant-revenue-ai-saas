const { send, handleOptions, getBearer } = require('../_lib/http');
const { isConfigured, select, getUserFromToken, getMemberships } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true, id: 'demo-user' };
    if (!isConfigured() || user.demo) {
      return send(res, 200, { ok: true, mode: 'demo', restaurants: [{ id: 'demo-restaurant', name: 'Restaurant Démo', city: 'Dakar', status: 'trial' }] });
    }
    const memberships = await getMemberships(user.id);
    const restaurants = memberships.map(m => ({ ...m.restaurants, role: m.role, member_status: m.status }));
    send(res, 200, { ok: true, mode: 'supabase', restaurants });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message });
  }
};
