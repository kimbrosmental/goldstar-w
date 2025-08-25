const CORS = {
  'access-control-allow-origin': '*',
  'content-type': 'application/json; charset=utf-8'
};

export async function onRequest({ request, env }) {
  try {
    const url = new URL(request.url);
    const ns = (url.searchParams.get('ns') || 'USERS').toUpperCase();
    const kv = env[ns];
    if (!kv) {
      return new Response(JSON.stringify({ ok:false, error:'no_binding', ns }), { status:400, headers:CORS });
    }

    const key = `kvping:${Date.now()}`;
    const out = { ns, key, steps: {} };

    try { await kv.put(key, 'pong', { expirationTtl: 30 }); out.steps.put = true; } catch (e) { out.steps.put = String(e); }
    try { out.steps.get = await kv.get(key); } catch (e) { out.steps.get = String(e); }
    try { await kv.delete(key); out.steps.delete = true; } catch (e) { out.steps.delete = String(e); }

    return new Response(JSON.stringify({ ok:true, result: out }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { status: 500, headers: CORS });
  }
}
