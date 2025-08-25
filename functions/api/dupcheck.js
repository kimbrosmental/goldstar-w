export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'access-control-allow-origin': '*' } });
  }
  try {
    const cors = { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' };
    const body = await request.json();
    const username = (body.username || '').toString().replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    const email = (body.email || '').toString().toLowerCase().trim();
    const phone = (body.phone || '').toString().replace(/\D/g,'').trim();

    if (username) {
      const u = await env.USERS.get('user:' + username);
      if (u) return new Response('이미 사용중인 아이디입니다.', { status: 409, headers: cors });
    }
    if (email) {
      const e = await env.USERS.get('index:email:' + email);
      if (e) return new Response('이미 사용중인 이메일입니다.', { status: 409, headers: cors });
    }
    if (phone) {
      const p = await env.USERS.get('index:phone:' + phone);
      if (p) return new Response('이미 사용중인 전화번호입니다.', { status: 409, headers: cors });
    }
    return new Response('사용 가능합니다.', { status: 200, headers: cors });
  } catch (e) {
    return new Response('요청 본문 오류', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' } });
  }
}
