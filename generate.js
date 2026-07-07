const { send, handleOptions, readJson, getBearer, required } = require('../_lib/http');
const { isConfigured, insert, getUserFromToken, requireMembership } = require('../_lib/supabase-rest');

function buildReport({ restaurantName, metrics, products, promotions }) {
  const totalProducts = (products || []).length;
  const activePromos = (promotions || []).filter(p => p.status === 'active').length;
  const revenue = Number(metrics && metrics.direct_revenue_xof || 1148000);
  const avgBasket = Number(metrics && metrics.average_basket_xof || 42300);
  const upsellRate = Number(metrics && metrics.upsell_rate || 67);
  const lines = [
    `Rapport performance - ${restaurantName || 'Restaurant'}`,
    `Date: ${new Date().toLocaleString('fr-FR')}`,
    '',
    `CA direct estimé: ${revenue.toLocaleString('fr-FR')} FCFA`,
    `Panier moyen: ${avgBasket.toLocaleString('fr-FR')} FCFA`,
    `Taux d'acceptation upsell: ${upsellRate}%`,
    `Produits configurés: ${totalProducts}`,
    `Promotions actives: ${activePromos}`,
    '',
    'Priorités IA:',
    '- Mettre en avant les plats signature après 19h30.',
    '- Pousser dessert ou boisson maison après chaque plat livrable.',
    '- Utiliser acompte wallet sur anniversaires, groupes et entreprise.',
    '- Surveiller les produits disponibles en livraison pour protéger l’expérience culinaire.'
  ];
  return lines.join('\n');
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const restaurantId = required(body.restaurant_id || req.headers['x-restaurant-id'], 'Restaurant id');
    const token = getBearer(req);
    const user = token ? await getUserFromToken(token) : { demo: true };
    const content = buildReport(body);
    if (!isConfigured() || user.demo) {
      return send(res, 200, { ok: true, mode: 'demo', report: { id: `demo-report-${Date.now()}`, restaurant_id: restaurantId, title: 'Rapport performance IA', content, created_at: new Date().toISOString() } });
    }
    await requireMembership(user, restaurantId, ['owner', 'manager', 'marketing']);
    const rows = await insert('reports', {
      restaurant_id: restaurantId,
      created_by: user.id,
      title: body.title || 'Rapport performance IA',
      report_type: 'performance_ai',
      metrics: body.metrics || {},
      content
    });
    send(res, 201, { ok: true, mode: 'supabase', report: rows[0] });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message, payload: error.payload || null });
  }
};
