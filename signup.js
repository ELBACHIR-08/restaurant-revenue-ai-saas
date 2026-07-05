import { hasSupabaseConfig, insertRow, slugify } from './_lib/supabase-rest.js';

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const restaurantName = body.restaurantName || body.restaurant || 'Restaurant demo';
  const plan = body.plan || 'growth';
  const now = new Date().toISOString();
  const trialEndsAt = addDays(now, 30);

  if (!hasSupabaseConfig()) {
    return res.status(200).json({
      ok: true,
      mode: 'demo-fallback',
      message: 'Compte restaurant demo cree. Connecte Supabase pour persister les donnees.',
      trialDays: 30,
      restaurant: {
        id: 'demo-restaurant-id',
        name: restaurantName,
        city: body.city || 'Dakar',
        district: body.district || '',
        type: body.restaurantType || 'Restaurant',
        status: 'trial_active'
      },
      subscription: {
        plan,
        status: 'trial_active',
        trialEndsAt
      }
    });
  }

  try {
    const restaurant = await insertRow('restaurants', {
      name: restaurantName,
      slug: `${slugify(restaurantName)}-${Date.now().toString(36)}`,
      city: body.city || 'Dakar',
      district: body.district || null,
      type: body.restaurantType || body.type || 'Restaurant',
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      status: 'trial_active',
      trial_started_at: now,
      trial_ends_at: trialEndsAt,
      created_at: now,
      updated_at: now
    });

    const subscription = await insertRow('subscriptions', {
      restaurant_id: restaurant.id,
      plan_code: plan,
      status: 'trial_active',
      trial_started_at: now,
      trial_ends_at: trialEndsAt,
      current_period_started_at: now,
      current_period_ends_at: trialEndsAt,
      created_at: now,
      updated_at: now
    });

    await insertRow('audit_logs', {
      restaurant_id: restaurant.id,
      actor_type: 'system',
      action: 'restaurant.signup',
      entity_type: 'restaurant',
      entity_id: restaurant.id,
      metadata: { plan, source: 'signup-api' },
      created_at: now
    });

    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      message: 'Compte restaurant cree avec succes',
      trialDays: 30,
      restaurant,
      subscription
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
