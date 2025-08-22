export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });

  const SEC = env.SECURITY || env.USERS;
  const admins = await SEC.get('admins');
  const ipRules = await SEC.get('ipRules');
  // 그대로 전달(프론트에서 decrypt 처리)
  return new Response(JSON.stringify({ admins: admins || null, ipRules: ipRules || null }), { status: 200, headers: cors });
}