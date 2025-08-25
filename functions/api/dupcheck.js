export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });

  try {
    const { username } = await request.json();
    const key = String(username || '').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    if (!key) return new Response('아이디를 입력하세요.', { status: 400, headers: CORS });

    // 1) USERS KV duplicate?
    if (await env.USERS.get(key)) {
      return new Response('이미 존재하는 아이디입니다.', { status: 409, headers: CORS });
    }
    // 2) admin special-case: if trying to register 'adminid', also block if SECURITY has it
    if (key === 'adminid' && env.SECURITY) {
      const adminStored = await env.SECURITY.get('adminid');
      if (adminStored) {
        return new Response('이미 존재하는 아이디입니다.', { status: 409, headers: CORS });
      }
      // also check blob 'security'.admins
      const blob = await env.SECURITY.get('security');
      if (blob) {
        try {
          const sec = JSON.parse(blob);
          const admins = Array.isArray(sec.admins) ? sec.admins : [];
          if (admins.find(a => String(a.username||'').toLowerCase().trim() === 'adminid')) {
            return new Response('이미 존재하는 아이디입니다.', { status: 409, headers: CORS });
          }
        } catch {}
      }
    }
    return new Response('사용 가능한 아이디입니다.', { status: 200, headers: CORS });
  } catch {
    return new Response('요청 본문 오류', { status: 400, headers: CORS });
  }
}
