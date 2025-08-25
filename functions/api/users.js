

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


export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const kv = env.USERS;

  if (request.method === 'GET') {
    const list = await kv.list();
    const out = [];
    for (const k of list.keys) {
      const raw = await kv.get(k.name);
      if (!raw) continue;
      try {
        const u = JSON.parse(raw);
        const res = { username: u.username, role: u.role||'USER', status: u.status||'active' };
        if (u.pii) {
          try { const dec = await decryptMaybe(u.pii, env); Object.assign(res, dec||{}); } catch { /* ignore */ }
        }
        out.push(res);
      } catch { /* ignore */ }
    }
    return new Response(JSON.stringify(out), { headers: CORS });
  }

  if (request.method === 'POST') {
    let body = {}; try { body = await request.json(); } catch {}
    const key = String(body.username||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    if (!key) return new Response(JSON.stringify({ error:'아이디 누락' }), { status:400, headers:CORS });
    const raw = await kv.get(key);
    if (!raw) return new Response(JSON.stringify({ error:'존재하지 않는 회원' }), { status:404, headers:CORS });
    let user = {}; try { user = JSON.parse(raw); } catch { user = {}; }

    // update role/status, and PII if provided
    if (body.role) user.role = body.role;
    if (body.status) user.status = body.status;
    const pii = {};
    if (body.email) pii.email = body.email;
    if (body.phone) pii.phone = body.phone;
    if (Object.keys(pii).length) user.pii = await encryptJson(pii, env);

    await kv.put(key, JSON.stringify(user));
    return new Response(JSON.stringify({ ok:true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:CORS });
}
