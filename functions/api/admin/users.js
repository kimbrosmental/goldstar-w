
const CORS = { 'Access-Control-Allow-Origin':'*',
               'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
               'Access-Control-Allow-Headers':'Content-Type',
               'Content-Type':'application/json' };

function ok(obj){ return new Response(JSON.stringify(obj), { headers:CORS }); }
function bad(obj, code){ return new Response(JSON.stringify(obj), { status:code||400, headers:CORS }); }
function normId(s){ return String(s||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim(); }

export async function onRequest({ request, env }){
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS });
  const kv = env.USERS;

  async function listAll(){
    const out = [];
    let cursor;
    do {
      const r = await kv.list({ cursor });
      cursor = r.cursor;
      for (const k of r.keys) {
        if (k.name.startsWith('_') || k.name.startsWith('ver:')) continue;
        const raw = await kv.get(k.name);
        if (raw) { try{ out.push(JSON.parse(raw)); }catch{} }
      }
    } while (cursor);
    return out;
  }

  if (request.method === 'GET'){
    const users = await listAll();
    return ok({ data: users, list: users, count: users.length });
  }

  if (request.method === 'POST'){
    let body={}; try{ body = await request.json(); }catch{}

    // Bulk save path: accept { data: JSON-stringified array of users }
    if (body && 'data' in body) {
      try {
        const arr = typeof body.data === 'string' ? JSON.parse(body.data) : (Array.isArray(body.data)? body.data : []);
        if (!Array.isArray(arr)) return bad({ error:'invalid_data' }, 400);
        for (const u of arr) {
          const key = normId(u && (u.username||u.id));
          if (!key) continue;
          await kv.put(key, JSON.stringify({ ...u, username: key }));
        }
        try { await env.SECURITY.put('ver:users', Date.now().toString()); } catch {}
        return ok({ ok:true, saved: arr.length });
      } catch {
        return bad({ error:'bad_data' }, 400);
      }
    }

    const action = String(body.action||'').toLowerCase();
    if (action === 'list' || action === 'get' || action === 'fetch'){
      const users = await listAll();
      return ok({ data: users, list: users, count: users.length });
    }
    const key = normId(body.username);
    if (!key) return bad({ error:'username_required' }, 400);
    const raw = await kv.get(key);
    if (!raw) return bad({ error:'not_found' }, 404);
    let user = {}; try{ user = JSON.parse(raw); }catch{ user = { username:key }; }

    if (action === 'approve') user.status = 'approved';
    else if (action === 'reject') user.status = 'rejected';
    else if (action === 'update' && body.updateData) Object.assign(user, body.updateData);
    else return bad({ error:'invalid_action' }, 400);

    await kv.put(key, JSON.stringify(user));
    try { await env.SECURITY.put('ver:users', Date.now().toString()); } catch {}
    return ok({ ok:true });
  }

  return bad({ error:'Method Not Allowed' }, 405);
}
