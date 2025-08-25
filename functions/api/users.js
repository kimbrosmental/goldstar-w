

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
  const kv = env.USERS;
  const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

  if (request.method === 'GET') {
    try {
      const users = [];
      let cursor = undefined;
      do {
        const res = await kv.list({ cursor });
        cursor = res.cursor;
        for (const k of res.keys) {
          if (k.name.startsWith('_') || k.name.startsWith('ver:')) continue;
          try { const raw = await kv.get(k.name); if (raw) users.push(JSON.parse(raw)); } catch {}
        }
        if (!res.list_complete && !cursor) break;
      } while (cursor);
      return new Response(JSON.stringify({ data: users }), { headers:cors });
    } catch (e) {
      return new Response(JSON.stringify({ error:'list_failed' }), { status:500, headers:cors });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const action = String(body.action||'').toLowerCase();
      const key = String(body.username||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
      if (!key) return new Response(JSON.stringify({ error:'username_required' }), { status:400, headers:cors });

      const raw = await kv.get(key);
      if (!raw) return new Response(JSON.stringify({ error:'not_found' }), { status:404, headers:cors });
      let user = null; try { user = JSON.parse(raw); } catch { user = { username:key }; }

      if (action === 'approve') user.status = 'approved';
      else if (action === 'reject') user.status = 'rejected';
      else if (action === 'update' && body.updateData) Object.assign(user, body.updateData);
      else return new Response(JSON.stringify({ error:'invalid_action' }), { status:400, headers:cors });

      await kv.put(key, JSON.stringify(user));
      await touchVersion(env, 'users');
      return new Response(JSON.stringify({ ok:true }), { headers:cors });
    } catch (e) {
      return new Response(JSON.stringify({ error:'update_failed' }), { status:500, headers:cors });
    }
  }

  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:cors });
}
