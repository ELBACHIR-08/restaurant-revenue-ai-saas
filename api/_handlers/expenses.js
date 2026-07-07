const { send, handleOptions, getBearer } = require('../_lib/http');
const { isConfigured, select, getUserFromToken, requireMembership } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const restaurantId = req.headers['x-restaurant-id'] || (req.query && req.query.restaurant_id) || 'demo-restaurant';
    
    if (req.method === 'GET') {
      const token = getBearer(req);
      const user = token ? await getUserFromToken(token) : { demo: true };
      
      if (!isConfigured() || user.demo) {
        return send(res, 200, { ok: true, mode: 'demo', expenses: [] });
      }
      
      await requireMembership(user, restaurantId);
      const expenses = await select('expenses', { restaurant_id: `eq.${restaurantId}`, order: 'created_at.desc' });
      return send(res, 200, { ok: true, mode: 'supabase', expenses });
    }

    return send(res, 405, { ok: false, error: 'Method not allowed' });

  } catch (error) {
    return send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
