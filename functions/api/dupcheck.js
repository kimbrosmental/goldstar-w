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
  try {
    let username = '', email = '', phone = '';
    if (request.method === 'GET') {
      const url = new URL(request.url);
      username = (url.searchParams.get('username') || '').toString();
      email = (url.searchParams.get('email') || '').toString();
      phone = (url.searchParams.get('phone') || '').toString();
    } else if (request.method === 'POST') {
      const body = await parseBody(request);
      username = (body.username || '').toString();
      email = (body.email || '').toString();
      phone = (body.phone || '').toString();
    } else {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    username = username.replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    email = email.toLowerCase().trim();
    phone = phone.replace(/\D/g,'').trim();

    // Only one field is required; check whichever provided
    if (!username && !email && !phone) {
      return new Response('요청 값이 없습니다.', { status: 400, headers: CORS });
    }

    if (username) {
      const u = await env.USERS.get('user:' + username);
      if (u) return new Response('이미 사용중인 아이디입니다.', { status: 409, headers: CORS });
    }
    if (email) {
      const e = await env.USERS.get('index:email:' + email);
      if (e) return new Response('이미 사용중인 이메일입니다.', { status: 409, headers: CORS });
    }
    if (phone) {
      const p = await env.USERS.get('index:phone:' + phone);
      if (p) return new Response('이미 사용중인 전화번호입니다.', { status: 409, headers: CORS });
    }

    return new Response('사용 가능합니다.', { status: 200, headers: CORS });
  } catch (e) {
    return new Response('서버 오류: ' + String(e), { status: 500, headers: CORS });
  }
}
