import { hasSupabaseConfig, selectRows } from './_lib/supabase-rest.js';

const demoRestaurants = [
  { id: 'demo-1', name: 'La Fourchette', city: 'Dakar', plan_code: 'premium_ai', status: 'trial_active', mrr: 50000 },
  { id: 'demo-2', name: 'Lounge Saly', city: 'Saly', plan_code: 'growth', status: 'trial_active', mrr: 30000 },
  { id: 'demo-3', name: 'Café Plateau', city: 'Dakar', plan_code: 'starter', status: 'active', mrr: 20000 }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (!hasSupabaseConfig()) {
    return res.status(200).json({ ok: true, mode: 'demo-fallback', restaurants: demoRestaurants });
  }

  try {
    const restaurants = await selectRows('restaurants', 'select=*&order=created_at.desc&limit=100');
    return res.status(200).json({ ok: true, mode: 'supabase', restaurants });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
