
const CORS = { 'Access-Control-Allow-Origin':'*',
               'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
               'Access-Control-Allow-Headers':'Content-Type',
               'Content-Type':'application/json' };

function ok(obj){ return new Response(JSON.stringify(obj), { headers:CORS }); }
function bad(obj, code){ return new Response(JSON.stringify(obj), { status:code||400, headers:CORS }); }
function normId(s){ return String(s||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim(); }

export async function onRequest({ request, env }){
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS });
  const kv = env.ORDERS;

  if (request.method === 'GET'){
    try{
      const raw = await kv.get('orders');
      const arr = raw ? JSON.parse(raw) : [];
      return ok({ data: arr, list: arr, count: Array.isArray(arr)?arr.length:0 });
    }catch{
      return ok({ data: [], list: [], count:0 });
    }
  }

  if (request.method === 'POST'){
    let body={}; try{ body = await request.json(); }catch{}
    const action = String(body.action||'').toLowerCase();
    if (action === 'list' || action === 'get' || action === 'fetch'){
      const raw = await kv.get('orders');
      const arr = raw ? JSON.parse(raw) : [];
      return ok({ data: arr, list: arr, count: Array.isArray(arr)?arr.length:0 });
    }
    if ('items' in body){
      await kv.put('orders', JSON.stringify(body.items));
      try { await env.SECURITY.put('ver:orders', Date.now().toString()); } catch {}
      return ok({ ok:true });
    }
    return bad({ error:'invalid_action' }, 400);
  }

  return bad({ error:'Method Not Allowed' }, 405);
}
