import { hasSupabaseConfig, insertRow, selectRows } from './_lib/supabase-rest.js';

const demoPromotions = [
  { id: 'demo-promo-1', name: 'Livraison offerte', trigger_rule: 'Panier > 30 000 FCFA', benefit: 'Frais offerts', status: 'active' },
  { id: 'demo-promo-2', name: 'Anniversaire', trigger_rule: 'Occasion = anniversaire', benefit: 'Dessert bougie + champagne suggéré', status: 'active' }
];

export default async function handler(req, res) {
  const restaurantId = req.query.restaurant_id || req.body?.restaurant_id || 'demo-restaurant-id';

  if (!hasSupabaseConfig()) {
    if (req.method === 'GET') return res.status(200).json({ ok: true, mode: 'demo-fallback', promotions: demoPromotions });
    if (req.method === 'POST') return res.status(200).json({ ok: true, mode: 'demo-fallback', promotion: { id: `demo-promo-${Date.now()}`, ...req.body } });
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      const promotions = await selectRows('promotions', `select=*&restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=created_at.desc`);
      return res.status(200).json({ ok: true, mode: 'supabase', promotions });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const promotion = await insertRow('promotions', {
        restaurant_id: restaurantId,
        name: body.name || body.type || 'Promotion',
        trigger_rule: body.trigger_rule || body.trigger || null,
        benefit: body.benefit || null,
        channel: body.channel || 'all',
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        status: body.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return res.status(200).json({ ok: true, mode: 'supabase', promotion });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
