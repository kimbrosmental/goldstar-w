
// Stores gold price settings in SECURITY: key 'goldprice'
export async function onRequest({ request, env }){
  const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });
  const kv = env.SECURITY;
  if (request.method === 'GET'){
    try {
      const raw = await kv.get('goldprice');
      const obj = raw ? JSON.parse(raw) : {};
      return new Response(JSON.stringify(obj), { headers: cors });
    } catch {
      return new Response(JSON.stringify({ manualGoldPrice: null }), { headers: cors });
    }
  }
  if (request.method === 'POST'){
    try {
      const body = await request.json();
      const data = body?.data || {};
      await kv.put('goldprice', JSON.stringify(data));
      return new Response(JSON.stringify({ ok:true }), { headers: cors });
    } catch {
      return new Response(JSON.stringify({ error:'bad request' }), { status:400, headers:cors });
    }
  }
  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:cors });
}
