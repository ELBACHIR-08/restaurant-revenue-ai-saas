const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseStatus() {
  return {
    configured: hasSupabaseConfig(),
    urlPresent: Boolean(SUPABASE_URL),
    serviceRolePresent: Boolean(SUPABASE_SERVICE_ROLE_KEY)
  };
}

function headers(extra = {}) {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase env vars missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
  }
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

function restUrl(path) {
  const cleanPath = path.replace(/^\//, '');
  return `${SUPABASE_URL}/rest/v1/${cleanPath}`;
}

export async function selectRows(table, query = 'select=*') {
  const response = await fetch(restUrl(`${table}?${query}`), {
    method: 'GET',
    headers: headers({ Prefer: 'return=representation' })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase select failed for ${table}`);
  }
  return data;
}

export async function insertRow(table, payload) {
  const response = await fetch(restUrl(table), {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase insert failed for ${table}`);
  }
  return Array.isArray(data) ? data[0] : data;
}

export async function updateRows(table, matchQuery, payload) {
  const response = await fetch(restUrl(`${table}?${matchQuery}`), {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase update failed for ${table}`);
  }
  return data;
}

export function slugify(input = '') {
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'restaurant';
}
