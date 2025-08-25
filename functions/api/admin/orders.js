export async function onRequest({ request, env }) {
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json; charset=utf-8' };
  if (request.method === 'GET') {
    const orders = await env.ORDERS.get('orders');
    return new Response(orders || '[]', { headers: cors });
  }
  if (request.method === 'POST') {
    let payload;
    try { payload = await request.json(); } catch { payload = {}; }
    const toSave = payload && payload.data != null ? payload.data : payload;
    const str = typeof toSave === 'string' ? toSave : JSON.stringify(toSave);
    await env.ORDERS.put('orders', str);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });
}
