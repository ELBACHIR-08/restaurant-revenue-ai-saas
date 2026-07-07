const { send, handleOptions } = require('./_lib/http');
const { isConfigured, env, select } = require('./_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  const configured = isConfigured();
  let db = 'not_configured';
  if (configured) {
    try {
      await select('plans', { limit: 1 });
      db = 'ok';
    } catch (error) {
      db = `error: ${error.message}`;
    }
  }
  send(res, 200, {
    ok: true,
    service: 'restaurant-revenue-ai-saas',
    version: '2.0.0-supabase-core',
    environment: process.env.APP_ENV || 'development',
    supabase: {
      configured,
      url_present: Boolean(env().url),
      anon_key_present: Boolean(env().anonKey),
      service_role_present: Boolean(env().serviceKey),
      db
    },
    time: new Date().toISOString()
  });
};
