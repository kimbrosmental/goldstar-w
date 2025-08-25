

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
  const cors = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' };
  const names = ['users','orders','inquiries','security'];
  const out = {};
  for (const n of names) {
    try { out[n] = await env.SECURITY.get('ver:'+n) || null; } catch { out[n] = null; }
  }
  out.now = Date.now();
  return new Response(JSON.stringify(out), { headers: cors });
}
