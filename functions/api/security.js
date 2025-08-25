

// --- helpers: version + AES decrypt (optional) -----------------------------
function nowToken() {
  const rand = Math.random().toString(36).slice(2);
  return Date.now().toString() + ':' + rand;
}

async function touchVersion(env, name) {
  try {
    if (env && env.SECURITY) {
      await env.SECURITY.put('ver:' + name, nowToken(), { expirationTtl: 60 * 60 * 24 * 7 });
    }
  } catch {}
}

export async function onRequest({ request, env }) {
  const kv = env.SECURITY;
  const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

  if (request.method === 'GET') {
    try {
      const raw = await kv.get('security');
      const obj = raw ? JSON.parse(raw) : {};
      if (!Array.isArray(obj.admins)) obj.admins = obj.admins || [];
      return new Response(JSON.stringify(obj), { headers:cors });
    } catch {
      return new Response(JSON.stringify({ admins:[] }), { headers:cors });
    }
  }

  if (request.method === 'POST') {
    try {
      const { data } = await request.json();
      let current = {};
      try { const raw = await kv.get('security'); current = raw ? JSON.parse(raw) : {}; } catch {}
      const merged = { ...current, ...data };
      await kv.put('security', JSON.stringify(merged));
      await touchVersion(env, 'security');
      return new Response(JSON.stringify({ ok:true }), { headers:cors });
    } catch {
      return new Response(JSON.stringify({ error:'save_failed' }), { status:500, headers:cors });
    }
  }

  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:cors });
}
