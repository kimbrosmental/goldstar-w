export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const KV = env.ORDERS || env.USERS;

  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error:'bad request' }), { status: 400, headers: cors }); }
    const enc = body.data;
    if (typeof enc !== 'string') return new Response(JSON.stringify({ error:'data must be string' }), { status: 400, headers: cors });
    await KV.put('inquiries', enc);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  }

  if (request.method === 'GET') {
    const data = await KV.get('inquiries');
    return new Response(JSON.stringify({ data: data || '[]' }), { status: 200, headers: cors });
  }

  return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status: 405, headers: cors });
}