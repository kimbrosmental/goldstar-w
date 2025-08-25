
const CORS = { 'Access-Control-Allow-Origin':'*',
               'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
               'Access-Control-Allow-Headers':'Content-Type',
               'Content-Type':'application/json' };

function ok(obj){ return new Response(JSON.stringify(obj), { headers:CORS }); }
function bad(obj, code){ return new Response(JSON.stringify(obj), { status:code||400, headers:CORS }); }
function normId(s){ return String(s||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim(); }

export async function onRequest({ request, env }){
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS });
  const kv = env.SECURITY;

  if (request.method === 'GET'){
    try{
      const raw = await kv.get('security');
      const obj = raw ? JSON.parse(raw) : {};
      if (!Array.isArray(obj.admins)) obj.admins = obj.admins || [];
      return ok({ data: obj, ...obj });
    }catch{
      return ok({ data: { admins:[] }, admins:[] });
    }
  }

  if (request.method === 'POST'){
    let body={}; try{ body = await request.json(); }catch{}
    const data = body.data || body || {};
    let current = {};
    try{ const raw = await kv.get('security'); current = raw ? JSON.parse(raw) : {}; }catch{}
    const merged = { ...current, ...data };
    await kv.put('security', JSON.stringify(merged));
    try { await env.SECURITY.put('ver:security', Date.now().toString()); } catch {}
    return ok({ ok:true });
  }

  return bad({ error:'Method Not Allowed' }, 405);
}
