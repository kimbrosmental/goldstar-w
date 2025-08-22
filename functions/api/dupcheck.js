export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

  let body = {};
  try { body = await request.json(); } catch { return new Response('bad request', { status: 400, headers: cors }); }

  const USERS = env.USERS;
  const username = (body.username || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
  const email = (body.email || '').toString().toLowerCase().trim();
  const phone = (body.phone || '').toString().replace(/\D/g, '');

  async function existsUsername(u) {
    if (!u) return false;
    const v = await USERS.get(`user:${u}`);
    return !!v;
  }
  async function existsEmail(e) {
    if (!e) return false;
    const v = await USERS.get(`index:email:${e}`);
    return !!v;
  }
  async function existsPhone(p) {
    if (!p) return false;
    const v = await USERS.get(`index:phone:${p}`);
    return !!v;
  }

  if (username) {
    const taken = await existsUsername(username);
    if (taken) return new Response('이미 사용중인 아이디입니다.', { status: 409, headers: cors });
    return new Response('사용 가능한 아이디입니다.', { status: 200, headers: cors });
  }
  if (email) {
    const taken = await existsEmail(email);
    if (taken) return new Response('이미 사용중인 이메일입니다.', { status: 409, headers: cors });
    return new Response('사용 가능한 이메일입니다.', { status: 200, headers: cors });
  }
  if (phone) {
    const taken = await existsPhone(phone);
    if (taken) return new Response('이미 사용중인 전화번호입니다.', { status: 409, headers: cors });
    return new Response('사용 가능한 전화번호입니다.', { status: 200, headers: cors });
  }
  return new Response('bad request', { status: 400, headers: cors });
}