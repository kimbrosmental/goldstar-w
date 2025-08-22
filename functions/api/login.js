export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: cors });

  try {
    const { username, password } = await request.json();
    const id = String(username || '').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    const pw = String(password || '').trim();
    if (!id || !pw) return new Response(JSON.stringify({ error: '아이디/비밀번호를 입력하세요.' }), { status: 400, headers: cors });

    // 1) Admins from SECURITY KV ('admins' key)
    if (env.SECURITY) {
      try {
        const raw = await env.SECURITY.get('admins');
        if (raw) {
          let admins = null;
          try { admins = JSON.parse(raw); } catch { admins = null; }
          if (Array.isArray(admins)) {
            const match = admins.find(a => String(a.username||'').toLowerCase().trim() === id);
            if (match && String(match.password||'').trim() === pw && (match.status||'active') === 'active') {
              return new Response(JSON.stringify({ ok: true, role: 'ADMIN', username: id, status: match.status || 'active' }), { status: 200, headers: cors });
            }
          } else if (typeof raw === 'string') {
            // raw may already be plain text or different format; ignore
          }
        }
      } catch {}
    }

    // 2) Bootstrap admin via env vars
    const bootstrapId = (env.ADMIN_ID||'').toLowerCase().trim();
    const bootstrapPw = String(env.ADMIN_PW||'').trim();
    if (bootstrapId && bootstrapPw && id === bootstrapId && pw === bootstrapPw) {
      return new Response(JSON.stringify({ ok: true, role: 'ADMIN', username: id, status: 'active' }), { status: 200, headers: cors });
    }

    // 3) Normal user
    const raw = await env.USERS.get(`user:${id}`);
    if (!raw) return new Response(JSON.stringify({ error: '존재하지 않는 아이디입니다.' }), { status: 404, headers: cors });
    let user;
    try { user = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error: '서버 데이터 오류' }), { status: 500, headers: cors }); }
    if (String(user.password||'').trim() !== pw) {
      return new Response(JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }), { status: 401, headers: cors });
    }
    const role = user.role || 'USER';
    const status = user.status || 'active';
    return new Response(JSON.stringify({ ok: true, role, username: id, status }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: '요청 본문 오류' }), { status: 400, headers: cors });
  }
}