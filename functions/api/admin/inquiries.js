
const CORS = { 'Access-Control-Allow-Origin':'*',
               'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS',
               'Access-Control-Allow-Headers':'Content-Type',
               'Content-Type':'application/json' };

function ok(obj){ return new Response(JSON.stringify(obj), { headers:CORS }); }
function bad(obj, code){ return new Response(JSON.stringify(obj), { status:code||400, headers:CORS }); }
function normId(s){ return String(s||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim(); }

export async function onRequest({ request, env }){
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS });
  const kv = env.INQUIRIES;
  const url = new URL(request.url);

  async function listAll(){
    const items = [];
    let cursor;
    do {
      const r = await kv.list({ prefix:'inq:', cursor });
      cursor = r.cursor;
      for (const k of r.keys){
        const raw = await kv.get(k.name);
        if (raw) items.push(JSON.parse(raw));
      }
    } while (cursor);
    return items;
  }

  if (request.method === 'GET'){
    const items = await listAll();
    return ok({ data: items, list: items, count: items.length });
  }

  if (request.method === 'POST'){
    let body={}; try{ body = await request.json(); }catch{}
    const action = String(body.action||'').toLowerCase();
    if (action === 'list' || action === 'get' || action === 'fetch'){
      const items = await listAll();
      return ok({ data: items, list: items, count: items.length });
    }
    const id = body.id || 'inq:'+crypto.randomUUID();
    const key = id.startsWith('inq:') ? id : ('inq:'+id);
    await kv.put(key, JSON.stringify({ ...body, id:key }));
    try { await env.SECURITY.put('ver:inquiries', Date.now().toString()); } catch {}
    return ok({ ok:true, id:key });
  }

  if (request.method === 'DELETE'){
    const id = url.searchParams.get('id') || '';
    if (!id) return bad({ error:'id_required' }, 400);
    const key = id.startsWith('inq:') ? id : ('inq:'+id);
    await kv.delete(key);
    try { await env.SECURITY.put('ver:inquiries', Date.now().toString()); } catch {}
    return ok({ ok:true });
  }

  return bad({ error:'Method Not Allowed' }, 405);
}
