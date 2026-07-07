const { send, handleOptions, getBearer, readJson, required } = require('./_lib/http');
const { isConfigured, select, update, getUserFromToken, isPlatformAdmin } = require('./_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true, email: 'demo@restaurant.ai' };
    if (!(await isPlatformAdmin(user))) return send(res, 403, { ok: false, error: 'Platform admin only' });
    if (!isConfigured() || user.demo) {
      return send(res, 200, { ok: true, mode: 'demo', restaurants: [
        { id: 'demo-r1', name: 'La Fourchette Dakar', city: 'Dakar', status: 'trial', owner_email: 'owner@example.com' },
        { id: 'demo-r2', name: 'Saly Beach Kitchen', city: 'Saly', status: 'active', owner_email: 'manager@example.com' }
      ] });
    }
    if (req.method === 'GET') {
      const restaurants = await select('restaurants', { select: 'id,name,city,district,type,status,owner_name,owner_email,owner_phone,created_at', order: 'created_at.desc' });
      return send(res, 200, { ok: true, mode: 'supabase', restaurants });
    }
    if (req.method === 'PATCH') {
      const body = await readJson(req);
      const id = required(body.id, 'Restaurant id');
      const allowed = ['status', 'name', 'city', 'district', 'type'];
      const payload = {};
      for (const key of allowed) if (key in body) payload[key] = body[key];
      const restaurants = await update('restaurants', { id: `eq.${id}` }, payload);
      return send(res, 200, { ok: true, mode: 'supabase', restaurant: restaurants[0] || null });
    }
    send(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
