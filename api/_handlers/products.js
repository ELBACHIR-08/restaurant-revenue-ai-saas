const { send, handleOptions, readJson, getBearer, required } = require('../_lib/http');
const { isConfigured, select, insert, update, remove, getUserFromToken, requireMembership, demoProducts } = require('../_lib/supabase-rest');

function normalizeProduct(body, restaurantId) {
  return {
    restaurant_id: restaurantId,
    name: String(required(body.name, 'Product name')),
    description: body.description ? String(body.description) : null,
    category: body.category ? String(body.category) : 'Carte',
    price: Number(required(body.price, 'Product price')),
    status: body.status || 'available',
    dine_in_enabled: body.dine_in_enabled !== false,
    delivery_enabled: Boolean(body.delivery_enabled),
    takeaway_enabled: body.takeaway_enabled !== false,
    preparation_time: body.preparation_time ? Number(body.preparation_time) : null,
    tags: Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',').map(x => x.trim()).filter(Boolean),
    allergens: Array.isArray(body.allergens) ? body.allergens : String(body.allergens || '').split(',').map(x => x.trim()).filter(Boolean),
    margin_estimate: body.margin_estimate ? Number(body.margin_estimate) : null,
    upsell_notes: body.upsell_notes ? String(body.upsell_notes) : null,
    image_url: body.image_url || null
  };
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const restaurantId = req.headers['x-restaurant-id'] || (req.query && req.query.restaurant_id) || 'demo-restaurant';
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true };
    if (!isConfigured() || user.demo) {
      if (req.method === 'GET') return send(res, 200, { ok: true, mode: 'demo', products: demoProducts() });
      const body = await readJson(req);
      return send(res, 200, { ok: true, mode: 'demo', product: { id: `demo-${Date.now()}`, ...normalizeProduct(body, restaurantId) } });
    }
    if (req.method === 'GET') {
      await requireMembership(user, restaurantId);
      const products = await select('products', { restaurant_id: `eq.${restaurantId}`, order: 'created_at.desc' });
      return send(res, 200, { ok: true, mode: 'supabase', products });
    }
    if (req.method === 'POST') {
      await requireMembership(user, restaurantId, ['owner', 'manager', 'marketing']);
      const body = await readJson(req);
      const products = await insert('products', normalizeProduct(body, restaurantId));
      return send(res, 201, { ok: true, mode: 'supabase', product: products[0] });
    }
    if (req.method === 'PATCH') {
      await requireMembership(user, restaurantId, ['owner', 'manager', 'marketing']);
      const body = await readJson(req);
      const id = required(body.id, 'Product id');
      const updates = { ...body };
      delete updates.id;
      delete updates.restaurant_id;
      const products = await update('products', { id: `eq.${id}`, restaurant_id: `eq.${restaurantId}` }, updates);
      return send(res, 200, { ok: true, mode: 'supabase', product: products[0] || null });
    }
    if (req.method === 'DELETE') {
      await requireMembership(user, restaurantId, ['owner', 'manager']);
      const body = await readJson(req);
      const id = required(body.id, 'Product id');
      const deleted = await remove('products', { id: `eq.${id}`, restaurant_id: `eq.${restaurantId}` });
      return send(res, 200, { ok: true, mode: 'supabase', deleted });
    }
    send(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
