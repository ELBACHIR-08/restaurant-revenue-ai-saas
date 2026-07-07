const { send, handleOptions, getBearer } = require('./_lib/http');
const { getUserFromToken, getMemberships, isPlatformAdmin } = require('./_lib/supabase-rest');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  try {
    const token = getBearer(req);
    const user = await getUserFromToken(token);
    const memberships = user.demo ? [{ restaurant_id: 'demo-restaurant', role: 'owner', status: 'active', restaurants: { id: 'demo-restaurant', name: 'Restaurant Démo', city: 'Dakar' } }] : await getMemberships(user.id);
    const platformAdmin = await isPlatformAdmin(user);
    send(res, 200, { ok: true, user: { id: user.id, email: user.email, name: user.user_metadata && user.user_metadata.name }, memberships, platformAdmin });
  } catch (error) {
    send(res, error.statusCode || 500, { ok: false, error: error.message });
  }
};
