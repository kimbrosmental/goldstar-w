

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
  const kv = env.INQUIRIES;
  const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

  const url = new URL(request.url);
  if (request.method === 'GET') {
    try {
      const items = [];
      let cursor;
      do {
        const res = await kv.list({ prefix:'inq:', cursor });
        cursor = res.cursor;
        for (const k of res.keys) {
          const raw = await kv.get(k.name);
          if (raw) items.push(JSON.parse(raw));
        }
      } while (cursor);
      return new Response(JSON.stringify(items), { headers:cors });
    } catch {
      return new Response(JSON.stringify([]), { headers:cors });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const id = body.id || ('inq:' + crypto.randomUUID());
      const key = id.startsWith('inq:') ? id : ('inq:' + id);
      await kv.put(key, JSON.stringify({ ...body, id:key }));
      await touchVersion(env, 'inquiries');
      return new Response(JSON.stringify({ ok:true, id:key }), { headers:cors });
    } catch {
      return new Response(JSON.stringify({ error:'save_failed' }), { status:500, headers:cors });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const id = url.searchParams.get('id') || '';
      if (!id) return new Response(JSON.stringify({ error:'id_required' }), { status:400, headers:cors });
      const key = id.startsWith('inq:') ? id : ('inq:' + id);
      await kv.delete(key);
      await touchVersion(env, 'inquiries');
      return new Response(JSON.stringify({ ok:true }), { headers:cors });
    } catch {
      return new Response(JSON.stringify({ error:'delete_failed' }), { status:500, headers:cors });
    }
  }

  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:cors });
}
