
// === AES-GCM helpers (tolerant) ============================================
function b64u(arr){ return btoa(String.fromCharCode(...arr)); }
function u8(b64){ try { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); } catch { return null; } }

async function importAesKey(env) {
  try {
    if (!env || !env.DATA_KEY) return null;
    const raw = Uint8Array.from(atob(env.DATA_KEY), c => c.charCodeAt(0));
    return await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt','decrypt']);
  } catch { return null; }
}

async function decryptMaybe(str, env) {
  try {
    if (typeof str !== 'string') return null;
    if (!str.startsWith('enc:v1:')) return null;
    const key = await importAesKey(env);
    if (!key) return null;
    const parts = str.split(':');
    if (parts.length !== 4) return null;
    const iv = u8(parts[2]); const ct = u8(parts[3]);
    if (!iv || !ct) return null;
    const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct);
    const json = new TextDecoder().decode(pt);
    return JSON.parse(json);
  } catch { return null; }
}


export async function onRequest({ request, env }) {
  const HDR = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Content-Type':'text/plain; charset=utf-8' };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers: HDR });

  let key = '';
  try {
    if (request.method === 'GET') {
      const u = new URL(request.url);
      key = String(u.searchParams.get('username')||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    } else if (request.method === 'POST') {
      const body = await request.json();
      key = String(body.username||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    } else {
      return new Response('Method Not Allowed', { status:405, headers: HDR });
    }
  } catch { return new Response('요청 본문 오류', { status:400, headers: HDR }); }

  if (!key) return new Response('아이디를 입력하세요.', { status:400, headers: HDR });

  // USERS KV
  if (await env.USERS.get(key)) return new Response('이미 존재하는 아이디입니다.', { status:409, headers: HDR });

  // SECURITY.adminid — encrypted admins[] or plain JSON. If unreadable, at least reserve "adminid"
  try {
    const secVal = env.SECURITY ? await env.SECURITY.get('adminid') : null;
    if (secVal) {
      let admins = null;
      const dec = await decryptMaybe(secVal, env);
      if (dec && Array.isArray(dec.admins)) admins = dec.admins;
      if (!admins) { try { const tmp = JSON.parse(secVal); if (tmp && Array.isArray(tmp.admins)) admins = tmp.admins; } catch {} }
      if (admins) {
        if (admins.find(a => String(a.username||'').toLowerCase().trim()===key)) {
          return new Response('이미 존재하는 아이디입니다.', { status:409, headers: HDR });
        }
      } else {
        if (key === 'adminid') return new Response('이미 존재하는 아이디입니다.', { status:409, headers: HDR });
      }
    }
  } catch { /* ignore */ }

  return new Response('사용 가능한 아이디입니다.', { status:200, headers: HDR });
}
