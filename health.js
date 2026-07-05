import { getSupabaseStatus } from './_lib/supabase-rest.js';

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: 'Restaurant Revenue AI SaaS',
    version: '1.2.0-production-core',
    environment: 'vercel-serverless',
    productionCore: true,
    supabase: getSupabaseStatus(),
    endpoints: [
      '/api/signup',
      '/api/restaurants',
      '/api/products',
      '/api/promotions',
      '/api/admin-summary'
    ]
  });
}
