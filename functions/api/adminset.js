

// === AES-GCM helpers (uses env.DATA_KEY base64) ============================
async function importAesKey(env) {
  if (!env.DATA_KEY) throw new Error('DATA_KEY missing');
  const raw = Uint8Array.from(atob(env.DATA_KEY), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt','decrypt']);
}
function b64u(arr){ return btoa(String.fromCharCode(...arr)); }
function u8(b64){ return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

export async function encryptJson(obj, env) {
  const key = await importAesKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data));
  return `enc:v1:${b64u(iv)}:${b64u(ct)}`;
}

export async function decryptMaybe(str, env) {
  if (typeof str !== 'string') return null;
  if (!str.startsWith('enc:v1:')) return null;
  const key = await importAesKey(env);
  const parts = str.split(':');
  if (parts.length !== 4) return null;
  const iv = u8(parts[2]);
  const ct = u8(parts[3]);
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct);
  const json = new TextDecoder().decode(pt);
  return JSON.parse(json);
}


// POST body: { admins: [{username, password, role: 'ADMIN'|'MANAGER', status:'active'|'inactive'}] }
export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Setup-Token',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:CORS });

  const token = request.headers.get('x-setup-token') || '';
  if (!env.ADMIN_SETUP_TOKEN || token !== env.ADMIN_SETUP_TOKEN) {
    return new Response(JSON.stringify({ error:'forbidden' }), { status:403, headers:CORS });
  }

  try {
    const body = await request.json();
    const admins = Array.isArray(body.admins) ? body.admins.slice(0,3) : [];
    if (!admins.length) return new Response(JSON.stringify({ error:'no admins' }), { status:400, headers:CORS });

    // Hash passwords, normalize shape
    async function pbkdf2Hash(pw) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), { name:'PBKDF2' }, false, ['deriveBits']);
      const iterations = 310000;
      const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations }, keyMaterial, 32*8);
      const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
      const saltB64 = btoa(String.fromCharCode(...salt));
      return `pbkdf2$${iterations}$${saltB64}$${hashB64}`;
    }

    const clean = [];
    for (const a of admins) {
      const username = String(a.username||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
      const role = (String(a.role||'ADMIN').toUpperCase()==='MANAGER') ? 'MANAGER':'ADMIN';
      const status = (String(a.status||'active').toLowerCase()==='inactive')?'inactive':'active';
      const pw = String(a.password||'').trim();
      if (!username || !pw) continue;
      const hashed = await pbkdf2Hash(pw);
      clean.push({ username, password: hashed, role, status });
    }
    if (!clean.length) return new Response(JSON.stringify({ error:'invalid admins' }), { status:400, headers:CORS });

    const payload = { admins: clean };
    const enc = await encryptJson(payload, env);
    await env.SECURITY.put('adminid', enc);
    return new Response(JSON.stringify({ ok:true, count: clean.length }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error:'bad request' }), { status:400, headers:CORS });
  }
}
