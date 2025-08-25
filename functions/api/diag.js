export async function onRequest({ env }) {
  try {
    const res = {};
    // Try basic write/read on USERS
    try {
      await env.USERS.put('diag:ping', 'pong', { expirationTtl: 60 });
      res.USERS = (await env.USERS.get('diag:ping')) === 'pong';
    } catch (e) { res.USERS = false; res.USERS_error = String(e); }
    // SECURITY present?
    try { res.SECURITY = !!env.SECURITY; } catch { res.SECURITY = false; }
    // ORDERS present?
    try { res.ORDERS = !!env.ORDERS; } catch { res.ORDERS = false; }

    return new Response(JSON.stringify({ kv: res }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'diag-failed', message: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
    });
  }
}
