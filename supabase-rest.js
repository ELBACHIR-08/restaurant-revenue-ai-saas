const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

function env() {
  return {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    platformAdminEmails: (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
  };
}

function isConfigured() {
  const e = env();
  return Boolean(e.url && e.serviceKey && e.anonKey);
}

function sbUrl(path) {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

async function request(path, options = {}) {
  if (!isConfigured()) {
    const error = new Error('Supabase is not configured');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
  const headers = {
    ...DEFAULT_HEADERS,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: options.prefer || 'return=representation',
    ...(options.headers || {})
  };
  const response = await fetch(sbUrl(path), { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    const error = new Error((data && (data.message || data.error_description || data.error)) || `Supabase request failed: ${response.status}`);
    error.statusCode = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function qs(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function select(table, params = {}) {
  const query = qs({ select: '*', ...params });
  return request(`/rest/v1/${table}?${query}`, { method: 'GET', prefer: undefined });
}

async function insert(table, payload) {
  return request(`/rest/v1/${table}`, { method: 'POST', body: JSON.stringify(payload) });
}

async function update(table, filters, payload) {
  const query = qs(filters);
  return request(`/rest/v1/${table}?${query}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

async function remove(table, filters) {
  const query = qs(filters);
  return request(`/rest/v1/${table}?${query}`, { method: 'DELETE', prefer: 'return=representation' });
}

async function authAdminCreateUser({ email, password, phone, name }) {
  return request('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      phone,
      email_confirm: true,
      user_metadata: { name }
    })
  });
}

async function authPasswordLogin(email, password) {
  if (!isConfigured()) {
    const error = new Error('Supabase is not configured');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(sbUrl('/auth/v1/token?grant_type=password'), {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      apikey: process.env.SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error((data && (data.error_description || data.msg || data.error)) || 'Login failed');
    error.statusCode = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function getUserFromToken(token) {
  if (!token) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }
  if (!isConfigured()) {
    return { id: 'demo-user', email: 'demo@restaurant.ai', user_metadata: { name: 'Demo Owner' }, demo: true };
  }
  const response = await fetch(sbUrl('/auth/v1/user'), {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error((data && (data.msg || data.error_description || data.error)) || 'Invalid token');
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

async function getMemberships(userId) {
  return select('restaurant_members', {
    user_id: `eq.${userId}`,
    select: 'id,restaurant_id,role,status,restaurants(id,name,city,status,slug)'
  });
}

async function requireMembership(user, restaurantId, allowedRoles = []) {
  if (user.demo) return { restaurant_id: restaurantId || 'demo-restaurant', role: 'owner', status: 'active' };
  const rows = await select('restaurant_members', {
    user_id: `eq.${user.id}`,
    restaurant_id: `eq.${restaurantId}`,
    status: 'eq.active',
    limit: 1
  });
  const membership = rows && rows[0];
  if (!membership) {
    const error = new Error('Access denied for this restaurant');
    error.statusCode = 403;
    throw error;
  }
  if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
    const error = new Error('Insufficient permissions');
    error.statusCode = 403;
    throw error;
  }
  return membership;
}

async function isPlatformAdmin(user) {
  const e = env();
  if (user.email && e.platformAdminEmails.includes(String(user.email).toLowerCase())) return true;
  if (user.demo) return true;
  const profiles = await select('profiles', { id: `eq.${user.id}`, limit: 1 });
  return Boolean(profiles && profiles[0] && profiles[0].is_platform_admin);
}

function demoProducts() {
  return [
    { id: 'demo-prod-1', restaurant_id: 'demo-restaurant', name: 'Chateaubriand 600g', category: 'Viandes', price: 45000, status: 'available', dine_in_enabled: true, delivery_enabled: false, takeaway_enabled: true, tags: ['signature', 'premium'], upsell_notes: 'Saint-Julien Petit Caillou, dessert signature' },
    { id: 'demo-prod-2', restaurant_id: 'demo-restaurant', name: 'Filet de daurade royale', category: 'Poissons', price: 16500, status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true, tags: ['léger', 'livrable'], upsell_notes: 'Chablis, crème brûlée' },
    { id: 'demo-prod-3', restaurant_id: 'demo-restaurant', name: 'Tiramisù déstructuré', category: 'Desserts', price: 7500, status: 'available', dine_in_enabled: true, delivery_enabled: true, takeaway_enabled: true, tags: ['dessert', 'upsell'], upsell_notes: 'Espresso Martini' }
  ];
}

function demoPromotions() {
  return [
    { id: 'demo-promo-1', restaurant_id: 'demo-restaurant', name: 'Menu déjeuner intelligent', channel: 'site_qr', discount_type: 'bundle', value: 0, status: 'active', rule_summary: 'Lundi-vendredi 12h-15h' },
    { id: 'demo-promo-2', restaurant_id: 'demo-restaurant', name: 'Anniversaire Premium', channel: 'chatbot', discount_type: 'gift', value: 0, status: 'active', rule_summary: 'Dessert bougie + suggestion champagne' }
  ];
}

module.exports = {
  env, isConfigured, request, select, insert, update, remove, qs,
  authAdminCreateUser, authPasswordLogin, getUserFromToken, getMemberships,
  requireMembership, isPlatformAdmin, demoProducts, demoPromotions
};
