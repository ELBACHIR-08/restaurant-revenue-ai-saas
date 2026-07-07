const { send, handleOptions, readJson, getBearer, required } = require('./_lib/http');
const { isConfigured, select, insert, update, remove, getUserFromToken, requireMembership, demoPromotions } = require('./_lib/supabase-rest');

function normalizePromotion(body, restaurantId) {
  return {
    restaurant_id: restaurantId,
    name: String(required(body.name, 'Promotion name')),
    description: body.description ? String(body.description) : null,
    channel: body.channel || 'chatbot',
    discount_type: body.discount_type || 'gift',
    value: body.value ? Number(body.value) : 0,
    status: body.status || 'active',
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    rule_summary: body.rule_summary ? String(body.rule_summary) : null,
    trigger_context: body.trigger_context ? String(body.trigger_context) : null
  };
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const restaurantId = req.headers['x-restaurant-id'] || (req.query && req.query.restaurant_id) || 'demo-restaurant';
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true };
    if (!isConfigured() || user.demo) {
      if (req.method === 'GET') return send(res, 200, { ok: true, mode: 'demo', promotions: demoPromotions() });
      const body = await readJson(req);
      return send(res, 200, { ok: true, mode: 'demo', promotion: { id: `demo-${Date.now()}`, ...normalizePromotion(body, restaurantId) } });
    }
    if (req.method === 'GET') {
      await requireMembership(user, restaurantId);
      const promotions = await select('promotions', { restaurant_id: `eq.${restaurantId}`, order: 'created_at.desc' });
      return send(res, 200, { ok: true, mode: 'supabase', promotions });
    }
    if (req.method === 'POST') {
      await requireMembership(user, restaurantId, ['owner', 'manager', 'marketing']);
      const body = await readJson(req);
      const promotions = await insert('promotions', normalizePromotion(body, restaurantId));
      return send(res, 201, { ok: true, mode: 'supabase', promotion: promotions[0] });
    }
    if (req.method === 'PATCH') {
      await requireMembership(user, restaurantId, ['owner', 'manager', 'marketing']);
      const body = await readJson(req);
      const id = required(body.id, 'Promotion id');
      const updates = { ...body };
      delete updates.id;
      delete updates.restaurant_id;
      const promotions = await update('promotions', { id: `eq.${id}`, restaurant_id: `eq.${restaurantId}` }, updates);
      return send(res, 200, { ok: true, mode: 'supabase', promotion: promotions[0] || null });
    }
    if (req.method === 'DELETE') {
      await requireMembership(user, restaurantId, ['owner', 'manager']);
      const body = await readJson(req);
      const id = required(body.id, 'Promotion id');
      const deleted = await remove('promotions', { id: `eq.${id}`, restaurant_id: `eq.${restaurantId}` });
      return send(res, 200, { ok: true, mode: 'supabase', deleted });
    }
    send(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
