const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

async function parseBody(request) {
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      return await request.json();
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const txt = await request.text();
      const p = new URLSearchParams(txt);
      const obj = {};
      for (const [k, v] of p) obj[k] = v;
      return obj;
    } else if (ct.includes('text/plain')) {
      const txt = (await request.text()).trim();
      // support raw username or key=value&key2=value2 forms
      if (txt.includes('=')) {
        const p = new URLSearchParams(txt);
        const obj = {};
        for (const [k, v] of p) obj[k] = v;
        return obj;
      }
      return { username: txt };
    } else {
      // try JSON first, then URLSearchParams
      const txt = await request.text();
      try { return JSON.parse(txt); } catch {}
      const p = new URLSearchParams(txt);
      const obj = {};
      for (const [k, v] of p) obj[k] = v;
      return obj;
    }
  } catch (e) {
    return {};
  }
}


export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });
  try {
    const data = await parseBody(request);
    let username = (data.username || '').toString();
    let password = (data.password || '').toString();
    let email = (data.email || '').toString();
    let phone = (data.phone || '').toString();

    username = username.replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    password = password.trim();
    email = email.toLowerCase().trim();
    phone = phone.replace(/\D/g,'').trim();

    if (!username || !password) {
      return new Response('아이디/비밀번호를 입력하세요.', { status: 400, headers: CORS });
    }

    const existing = await env.USERS.get('user:' + username);
    if (existing) return new Response('이미 존재하는 아이디입니다.', { status: 409, headers: CORS });
    if (email) {
      const e = await env.USERS.get('index:email:' + email);
      if (e) return new Response('이미 사용중인 이메일입니다.', { status: 409, headers: CORS });
    }
    if (phone) {
      const p = await env.USERS.get('index:phone:' + phone);
      if (p) return new Response('이미 사용중인 전화번호입니다.', { status: 409, headers: CORS });
    }

    const now = new Date().toISOString();
    const userObj = { username, password, email, phone, role: 'USER', status: 'active', createdAt: now };
    await env.USERS.put('user:' + username, JSON.stringify(userObj));
    if (email) await env.USERS.put('index:email:' + email, username);
    if (phone) await env.USERS.put('index:phone:' + phone, username);

    return new Response('회원가입 완료', { status: 200, headers: CORS });
  } catch (e) {
    return new Response('서버 오류: ' + String(e), { status: 500, headers: CORS });
  }
}
