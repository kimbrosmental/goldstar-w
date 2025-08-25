export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'access-control-allow-origin': '*' } });
  }
  const cors = { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' };
  try {
    const data = await request.json();
    const username = (data.username || '').toString().replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    const password = (data.password || '').toString().trim();
    const email = (data.email || '').toString().toLowerCase().trim();
    const phone = (data.phone || '').toString().replace(/\D/g,'').trim();

    if (!username || !password) {
      return new Response('아이디/비밀번호를 입력하세요.', { status: 400, headers: cors });
    }

    const existing = await env.USERS.get('user:' + username);
    if (existing) return new Response('이미 존재하는 아이디입니다.', { status: 409, headers: cors });
    if (email) {
      const e = await env.USERS.get('index:email:' + email);
      if (e) return new Response('이미 사용중인 이메일입니다.', { status: 409, headers: cors });
    }
    if (phone) {
      const p = await env.USERS.get('index:phone:' + phone);
      if (p) return new Response('이미 사용중인 전화번호입니다.', { status: 409, headers: cors });
    }

    const now = new Date().toISOString();
    const userObj = { username, password, email, phone, role: 'USER', status: 'active', createdAt: now };
    await env.USERS.put('user:' + username, JSON.stringify(userObj));
    if (email) await env.USERS.put('index:email:' + email, username);
    if (phone) await env.USERS.put('index:phone:' + phone, username);

    return new Response('회원가입 완료', { status: 200, headers: cors });
  } catch (e) {
    return new Response('요청 본문 오류', { status: 400, headers: cors });
  }
}
