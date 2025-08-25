export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*' } });
  }
  const list = await env.USERS.list({ prefix: 'user:' });
  const data = [];
  for (const k of list.keys) {
    const raw = await env.USERS.get(k.name);
    if (raw) {
      try { data.push(JSON.parse(raw)); } catch {}
    }
  }
  return new Response(JSON.stringify({ data }), { headers: { 'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*' } });
}
