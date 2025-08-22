export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

  let body = {};
  try { body = await request.json(); } catch { return new Response('요청 본문 오류', { status: 400, headers: cors }); }

  const USERS = env.USERS;
  const username = String(body.username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
  const email = String(body.email || '').toLowerCase().trim();
  const phone = String(body.phone || '').replace(/\D/g, '');
  const password = String(body.password || '').trim();
  const name = String(body.name || '').trim();
  const birth = String(body.birth || '').trim();
  const bank = String(body.bank || '').trim();
  const account = String(body.account || '').trim();

  if (!username) return new Response('아이디를 입력하세요.', { status: 400, headers: cors });
  if (!password) return new Response('비밀번호를 입력하세요.', { status: 400, headers: cors });

  async function exists(key) { return !!(await USERS.get(key)); }

  if (await exists(`user:${username}`)) return new Response('이미 존재하는 아이디입니다.', { status: 409, headers: cors });
  if (email && await exists(`index:email:${email}`)) return new Response('이미 존재하는 이메일입니다.', { status: 409, headers: cors });
  if (phone && await exists(`index:phone:${phone}`)) return new Response('이미 존재하는 전화번호입니다.', { status: 409, headers: cors });

  const user = {
    username, password, email, phone, name, birth, bank, account,
    role: 'USER',
    status: 'pending',
    created: new Date().toISOString()
  };

  await USERS.put(`user:${username}`, JSON.stringify(user));
  if (email) await USERS.put(`index:email:${email}`, username);
  if (phone) await USERS.put(`index:phone:${phone}`, username);

  return new Response('회원가입 완료', { status: 201, headers: cors });
}