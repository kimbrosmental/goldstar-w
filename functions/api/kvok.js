export async function onRequest({ env }) {
  return new Response(JSON.stringify({
    USERS: !!env.USERS,
    SECURITY: !!env.SECURITY,
    ORDERS: !!env.ORDERS,
    INQUIRIES: !!env.INQUIRIES
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*'
    }
  });
}
