export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const USERS = env.USERS;

  if (request.method === 'GET') {
    // Return stored encrypted blob if exists
    const blob = await USERS.get('users_encrypted');
    return new Response(JSON.stringify({ data: blob || null }), { status: 200, headers: cors });
  }

  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: cors }); }
    const enc = body.data;
    if (typeof enc !== 'string') return new Response(JSON.stringify({ error: 'data must be string' }), { status: 400, headers: cors });

    // Save raw encrypted blob for front-end compatibility
    await USERS.put('users_encrypted', enc);

    // Best-effort: try to parse plaintext JSON and update individual records
    try {
      const parsed = JSON.parse(enc);
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          const username = String(u.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
          if (!username) continue;
          // update indexes
          if (u.email) await USERS.put(`index:email:${String(u.email).toLowerCase().trim()}`, username);
          if (u.phone) await USERS.put(`index:phone:${String(u.phone).replace(/\D/g, '')}`, username);
          await USERS.put(`user:${username}`, JSON.stringify(u));
        }
      }
    } catch {}

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });
}