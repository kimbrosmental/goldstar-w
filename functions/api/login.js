export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } });
  }
  const cors = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  try {
    const { username, password } = await request.json();
    const id = (username || '').toString().replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    const pw = (password || '').toString().trim();
    if (!id || !pw) return new Response(JSON.stringify({ error: '아이디/비밀번호를 입력하세요.' }), { status: 400, headers: cors });

    try {
      const secRaw = await env.SECURITY.get('security');
      if (secRaw) {
        const sec = JSON.parse(secRaw);
        const admins = Array.isArray(sec.admins) ? sec.admins : [];
        const match = admins.find(a => (a && (a.username||'').toLowerCase().trim() === id));
        if (match && String(match.password||'').trim() === pw && (match.status||'active') === 'active') {
          return new Response(JSON.stringify({ ok: true, role: 'ADMIN', username: id, status: match.status || 'active' }), { status: 200, headers: cors });
        }
      }
    } catch {}

    const bootId = (env.ADMIN_ID || '').toString().toLowerCase().trim();
    const bootPw = (env.ADMIN_PW || '').toString().trim();
    if (bootId && bootPw && id === bootId && pw === bootPw) {
      return new Response(JSON.stringify({ ok: true, role: 'ADMIN', username: id, status: 'active' }), { status: 200, headers: cors });
    }

    const raw = await env.USERS.get('user:' + id);
    if (!raw) return new Response(JSON.stringify({ error: '존재하지 않는 아이디입니다.' }), { status: 404, headers: cors });
    let user;
    try { user = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error: '서버 데이터 오류' }), { status: 500, headers: cors }); }
    if ((user.password || '').toString().trim() !== pw) {
      return new Response(JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }), { status: 401, headers: cors });
    }
    const role = user.role || 'USER';
    const status = user.status || 'active';
    return new Response(JSON.stringify({ ok: true, role, username: id, status }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: '요청 본문 오류' }), { status: 400, headers: cors });
  }
}
