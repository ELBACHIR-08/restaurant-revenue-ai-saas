import { hasSupabaseConfig, selectRows } from './_lib/supabase-rest.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!hasSupabaseConfig()) {
    return res.status(200).json({
      ok: true,
      mode: 'demo-fallback',
      summary: {
        restaurants: 38,
        trials: 12,
        activeSubscriptions: 26,
        mrrPotential: 1210000,
        supportOpen: 7,
        conversionTrial: 64
      }
    });
  }

  try {
    const restaurants = await selectRows('restaurants', 'select=id,status&limit=1000');
    const subscriptions = await selectRows('subscriptions', 'select=id,status,plan_code&limit=1000');
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const trials = restaurants.filter(r => String(r.status || '').includes('trial')).length;
    const mrrByPlan = { starter: 20000, growth: 30000, premium_ai: 50000, premium: 50000 };
    const mrrPotential = subscriptions.reduce((sum, s) => sum + (mrrByPlan[s.plan_code] || 0), 0);
    return res.status(200).json({
      ok: true,
      mode: 'supabase',
      summary: {
        restaurants: restaurants.length,
        trials,
        activeSubscriptions,
        mrrPotential,
        supportOpen: 0,
        conversionTrial: restaurants.length ? Math.round((activeSubscriptions / restaurants.length) * 100) : 0
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
