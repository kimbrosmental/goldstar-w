export async function onRequest({ request, env }) {
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json; charset=utf-8' };
  function normRules(rules) {
    if (!Array.isArray(rules)) return [];
    return rules.map(x => String(x||'').trim()).filter(Boolean);
  }
  if (request.method === 'GET') {
    let sec = {};
    try { const raw = await env.SECURITY.get('security'); if (raw) sec = JSON.parse(raw); } catch {}
    const ipRules = Array.isArray(sec.ipRules) ? sec.ipRules : [];
    return new Response(JSON.stringify({ ipRules }), { headers: cors });
  }
  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {}
    let sec = {};
    try { const raw = await env.SECURITY.get('security'); if (raw) sec = JSON.parse(raw); } catch {}
    sec.ipRules = normRules(body.ipRules);
    await env.SECURITY.put('security', JSON.stringify(sec));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });
}
