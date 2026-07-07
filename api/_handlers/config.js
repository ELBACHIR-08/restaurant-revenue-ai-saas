const { send, handleOptions } = require('../_lib/http');
const { env, isConfigured } = require('../_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  const e = env();
  send(res, 200, {
    configured: isConfigured(),
    supabaseUrl: e.url || null,
    anonKeyPresent: Boolean(e.anonKey),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    mode: isConfigured() ? 'supabase' : 'demo'
  });
};
