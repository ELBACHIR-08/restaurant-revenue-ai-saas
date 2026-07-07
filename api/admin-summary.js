const { send, handleOptions, getBearer } = require('./_lib/http');
const { isConfigured, select, getUserFromToken, isPlatformAdmin } = require('./_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true, email: 'demo@restaurant.ai' };
    const platformAdmin = await isPlatformAdmin(user);
    if (!platformAdmin) return send(res, 403, { ok: false, error: 'Platform admin only' });
    if (!isConfigured() || user.demo) {
      return send(res, 200, {
        ok: true,
        mode: 'demo',
        summary: {
          restaurants: 18,
          trial_active: 11,
          active_subscriptions: 7,
          mrr_xof: 260000,
          pending_onboarding: 5,
          support_open: 3,
          churn_risk: 2
        }
      });
    }
    const restaurants = await select('restaurants', { select: 'id,status' });
    const subscriptions = await select('subscriptions', { select: 'id,status,plans(code,price_monthly_xof)' });
    const support = await select('support_tickets', { select: 'id,status' });
    const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trial_active');
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.plans && s.plans.price_monthly_xof || 0), 0);
    send(res, 200, {
      ok: true,
      mode: 'supabase',
      summary: {
        restaurants: restaurants.length,
        trial_active: subscriptions.filter(s => s.status === 'trial_active').length,
        active_subscriptions: activeSubs.length,
        mrr_xof: mrr,
        pending_onboarding: restaurants.filter(r => r.status === 'trial').length,
        support_open: support.filter(t => t.status === 'open').length,
        churn_risk: subscriptions.filter(s => s.status === 'past_due').length
      }
    });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
