

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
  const kv = env.ORDERS;
  const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

  if (request.method === 'GET') {
    try {
      const raw = await kv.get('orders');
      const data = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify(data), { headers:cors });
    } catch {
      return new Response(JSON.stringify([]), { headers:cors });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      await kv.put('orders', JSON.stringify(body));
      await touchVersion(env, 'orders');
      return new Response(JSON.stringify({ ok:true }), { headers:cors });
    } catch {
      return new Response(JSON.stringify({ error:'save_failed' }), { status:500, headers:cors });
    }
  }

  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:cors });
}
