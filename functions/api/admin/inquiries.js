export async function onRequest({ request, env }) {
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json; charset=utf-8' };
  if (request.method === 'GET') {
    const v = await env.ORDERS.get('inquiries');
    return new Response(v || '[]', { headers: cors });
  }
  if (request.method === 'POST') {
    let payload;
    try { payload = await request.json(); } catch { payload = {}; }
    const toSave = payload && payload.data != null ? payload.data : payload;
    const str = typeof toSave === 'string' ? toSave : JSON.stringify(toSave);
    await env.ORDERS.put('inquiries', str);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });
}
