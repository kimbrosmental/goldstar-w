export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });

  const list = await env.USERS.list({ prefix: 'user:' });
  const users = [];
  for (const k of list.keys) {
    const raw = await env.USERS.get(k.name);
    if (raw) {
      try { users.push(JSON.parse(raw)); } catch {}
    }
  }
  return new Response(JSON.stringify({ data: users }), { status: 200, headers: cors });
}