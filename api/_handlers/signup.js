const { send, handleOptions, readJson, required } = require('../_lib/http');
const { isConfigured, authAdminCreateUser, insert, select } = require('../_lib/supabase-rest');

function slugify(value) {
  return String(value || 'restaurant')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 48) || 'restaurant';
}

async function getPlanId(planCode) {
  const rows = await select('plans', { code: `eq.${planCode || 'growth'}`, limit: 1 });
  return rows && rows[0] ? rows[0].id : null;
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const restaurantName = String(required(body.restaurantName, 'Restaurant name'));
    const ownerName = String(required(body.ownerName, 'Owner name'));
    const email = String(required(body.email, 'Email')).toLowerCase();
    const phone = String(required(body.phone, 'Phone'));
    const password = String(body.password || `RestoAI-${Math.random().toString(36).slice(2, 10)}!`);
    const city = String(body.city || 'Dakar');
    const district = String(body.district || '');
    const restaurantType = String(body.restaurantType || 'restaurant');
    const selectedPlan = String(body.selectedPlan || 'growth');
    const modules = Array.isArray(body.modules) ? body.modules : ['reservations', 'orders', 'promotions', 'crm'];

    if (!isConfigured()) {
      return send(res, 200, {
        ok: true,
        mode: 'demo',
        message: 'Demo signup accepted. Configure Supabase env vars for real persistence.',
        restaurant: { id: 'demo-restaurant', name: restaurantName, city, district, type: restaurantType },
        user: { id: 'demo-user', email, name: ownerName },
        subscription: { status: 'trial_active', plan: selectedPlan, trial_days: 30 }
      });
    }

    const user = await authAdminCreateUser({ email, password, phone, name: ownerName });
    const profilePayload = {
      id: user.id,
      full_name: ownerName,
      email,
      phone,
      is_platform_admin: false
    };
    await insert('profiles', profilePayload);

    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    const slugBase = slugify(restaurantName);
    const restaurants = await insert('restaurants', {
      name: restaurantName,
      slug: `${slugBase}-${Math.random().toString(36).slice(2, 7)}`,
      city,
      district,
      type: restaurantType,
      owner_name: ownerName,
      owner_email: email,
      owner_phone: phone,
      status: 'trial',
      modules
    });
    const restaurant = restaurants[0];
    await insert('restaurant_members', {
      restaurant_id: restaurant.id,
      user_id: user.id,
      role: 'owner',
      status: 'active'
    });
    const planId = await getPlanId(selectedPlan);
    const subscriptions = await insert('subscriptions', {
      restaurant_id: restaurant.id,
      plan_id: planId,
      status: 'trial_active',
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
      payment_provider: 'manual_pending'
    });
    await insert('restaurant_settings', {
      restaurant_id: restaurant.id,
      onboarding_status: 'started',
      menu_source: body.menuSource || null,
      modules
    });
    send(res, 201, {
      ok: true,
      mode: 'supabase',
      restaurant,
      user: { id: user.id, email, name: ownerName },
      subscription: subscriptions[0],
      temporaryPasswordUsed: !body.password
    });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
