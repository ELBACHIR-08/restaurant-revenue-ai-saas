const { send, handleOptions, getBearer } = require('../_lib/http');
const { isConfigured, select, getUserFromToken, isPlatformAdmin } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true, email: 'demo@restaurant.ai' };
    if (!(await isPlatformAdmin(user))) return send(res, 403, { ok: false, error: 'Platform admin only' });
    if (!isConfigured() || user.demo) {
      return send(res, 200, { ok: true, mode: 'demo', subscriptions: [
        { id: 'sub-1', restaurant_id: 'demo-r1', status: 'trial_active', plan: 'Growth', amount: 30000, trial_end: new Date(Date.now() + 12 * 86400000).toISOString() },
        { id: 'sub-2', restaurant_id: 'demo-r2', status: 'active', plan: 'Premium AI', amount: 50000, trial_end: null }
      ] });
    }
    const subscriptions = await select('subscriptions', {
      select: 'id,status,trial_start,trial_end,current_period_end,payment_provider,last_payment_at,next_billing_at,restaurants(id,name,city),plans(code,name,price_monthly_xof)',
      order: 'created_at.desc'
    });
    send(res, 200, { ok: true, mode: 'supabase', subscriptions });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
