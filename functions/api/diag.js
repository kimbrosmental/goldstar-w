export async function onRequest({ env }) {
  try {
    await env.USERS.put('diag:ping', 'pong', { expirationTtl: 60 });
    const v = await env.USERS.get('diag:ping');
    const hasUsers = v === 'pong';
    const hasSecurity = !!env.SECURITY;
    const hasOrders = !!env.ORDERS;
    return new Response(JSON.stringify({ kv: { USERS: hasUsers, SECURITY: hasSecurity, ORDERS: hasOrders } }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'KV binding missing?', message: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  }
}
