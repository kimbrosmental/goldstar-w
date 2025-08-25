
// Stores encrypted ipRules blob in SECURITY: key 'iprules'
export async function onRequest({ request, env }){
  const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });
  const kv = env.SECURITY;
  if (request.method === 'GET'){
    try {
      const data = await kv.get('iprules');
      return new Response(JSON.stringify({ data: data || '' }), { headers: cors });
    } catch {
      return new Response(JSON.stringify({ data: '' }), { headers: cors });
    }
  }
  if (request.method === 'POST'){
    try {
      const body = await request.json();
      const enc = typeof body?.data === 'string' ? body.data : JSON.stringify(body?.data||'');
      await kv.put('iprules', enc);
      return new Response(JSON.stringify({ ok:true }), { headers: cors });
    } catch {
      return new Response(JSON.stringify({ error:'bad request' }), { status:400, headers:cors });
    }
  }
  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:cors });
}
