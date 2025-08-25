// functions/api/kvok.js
// GET /api/kvok  -> { USERS: true/false, SECURITY: true/false, ORDERS: true/false }
export async function onRequest({ env }) {
  return new Response(JSON.stringify({
    USERS: !!env.USERS,
    SECURITY: !!env.SECURITY,
    ORDERS: !!env.ORDERS,
  }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
  });
}
