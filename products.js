import { hasSupabaseConfig, insertRow, selectRows } from './_lib/supabase-rest.js';

const demoProducts = [
  { id: 'demo-1', name: 'Chateaubriand 600g', category: 'Viande premium', price: 45000, delivery_enabled: false, takeaway_enabled: true, margin_rate: 54, tags: ['Signature', 'Premium', 'Sur place'] },
  { id: 'demo-2', name: 'Filet de daurade royale', category: 'Poisson', price: 16500, delivery_enabled: true, takeaway_enabled: true, margin_rate: 48, tags: ['Livraison OK', 'Upsell dessert'] },
  { id: 'demo-3', name: 'Tiramisù déstructuré', category: 'Dessert', price: 7500, delivery_enabled: true, takeaway_enabled: true, margin_rate: 62, tags: ['Dessert', 'Upsell'] }
];

export default async function handler(req, res) {
  const restaurantId = req.query.restaurant_id || req.body?.restaurant_id || 'demo-restaurant-id';

  if (!hasSupabaseConfig()) {
    if (req.method === 'GET') return res.status(200).json({ ok: true, mode: 'demo-fallback', products: demoProducts });
    if (req.method === 'POST') return res.status(200).json({ ok: true, mode: 'demo-fallback', product: { id: `demo-${Date.now()}`, ...req.body } });
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      const products = await selectRows('products', `select=*&restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=created_at.desc`);
      return res.status(200).json({ ok: true, mode: 'supabase', products });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const product = await insertRow('products', {
        restaurant_id: restaurantId,
        name: body.name,
        description: body.description || null,
        category: body.category || 'Plat',
        price: Number(body.price || 0),
        delivery_enabled: Boolean(body.delivery_enabled ?? body.delivery ?? true),
        takeaway_enabled: Boolean(body.takeaway_enabled ?? body.takeaway ?? true),
        dine_in_enabled: Boolean(body.dine_in_enabled ?? true),
        margin_rate: Number(body.margin_rate || body.margin || 0),
        tags: body.tags || [],
        status: body.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return res.status(200).json({ ok: true, mode: 'supabase', product });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
