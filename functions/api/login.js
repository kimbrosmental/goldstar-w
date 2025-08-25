export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS });
  }

  try {
    const { username, password } = await request.json();
    const id = String(username || '').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    const pw = String(password || '').trim();
    if (!id || !pw) {
      return new Response(JSON.stringify({ error: '아이디/비밀번호를 입력하세요.' }), { status: 400, headers: CORS });
    }

    // ---- helper: sha256 hex
    async function sha256Hex(text) {
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    function looksHex64(s){ return typeof s==='string' && /^[a-f0-9]{64}$/i.test(s); }
    function looksBase64(s){ return typeof s==='string' && s.length%4===0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s); }

    async function verify(stored, input) {
      if (stored == null) return false;
      if (stored === input) return true;
      // JSON object case
      try {
        const obj = JSON.parse(stored);
        if (obj && typeof obj === 'object') {
          if (obj.password && (obj.password === input)) return true;
          if (obj.password && (await verify(obj.password, input))) return true;
        }
      } catch {}
      // sha256:xxxx
      if (stored.startsWith && stored.startsWith('sha256:')) {
        const hex = await sha256Hex(input);
        return stored.slice(7).toLowerCase() === hex.toLowerCase();
      }
      // plain 64-hex
      if (looksHex64(stored)) {
        const hex = await sha256Hex(input);
        return stored.toLowerCase() === hex.toLowerCase();
      }
      // base64(plaintext)
      if (looksBase64(stored)) {
        try {
          const decoded = atob(stored);
          if (decoded === input) return true;
        } catch {}
      }
      return false;
    }

    // 1) admin via SECURITY: key 'adminid'
    if (env.SECURITY && id === 'adminid') {
      const stored = await env.SECURITY.get('adminid');
      if (!stored) {
        // try blob 'security' with admins array
        const blob = await env.SECURITY.get('security');
        if (blob) {
          try {
            const sec = JSON.parse(blob);
            const admins = Array.isArray(sec.admins) ? sec.admins : [];
            const adm = admins.find(a => String(a.username||'').toLowerCase().trim() === 'adminid');
            if (adm && (await verify(adm.password || '', pw))) {
              return new Response(JSON.stringify({ ok:true, role:'ADMIN', username:id, status: adm.status || 'active' }), { status: 200, headers: CORS });
            }
          } catch {}
        }
        return new Response(JSON.stringify({ error: '관리자 계정이 없습니다.' }), { status: 404, headers: CORS });
      }
      if (await verify(stored, pw)) {
        return new Response(JSON.stringify({ ok:true, role:'ADMIN', username:id, status:'active' }), { status: 200, headers: CORS });
      }
      return new Response(JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }), { status: 401, headers: CORS });
    }

    // 2) fallback admin via env vars
    const bootId = (env.ADMIN_ID||'').toLowerCase().trim();
    const bootPw = String(env.ADMIN_PW||'').trim();
    if (bootId && bootPw && id === bootId && pw === bootPw) {
      return new Response(JSON.stringify({ ok:true, role:'ADMIN', username:id, status:'active' }), { status: 200, headers: CORS });
    }

    // 3) normal user in USERS KV
    const raw = await env.USERS.get(id);
    if (!raw) return new Response(JSON.stringify({ error: '존재하지 않는 아이디입니다.' }), { status: 404, headers: CORS });
    let user;
    try { user = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error: '서버 데이터 오류' }), { status: 500, headers: CORS }); }
    if (!(await verify(user.password || '', pw))) {
      return new Response(JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }), { status: 401, headers: CORS });
    }
    const role = user.role || 'USER';
    const status = user.status || 'active';
    return new Response(JSON.stringify({ ok:true, role, username:id, status }), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: '요청 본문 오류' }), { status: 400, headers: CORS });
  }
}
