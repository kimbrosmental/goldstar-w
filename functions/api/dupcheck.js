

// === AES-GCM helpers (uses env.DATA_KEY base64) ============================
async function importAesKey(env) {
  if (!env.DATA_KEY) throw new Error('DATA_KEY missing');
  const raw = Uint8Array.from(atob(env.DATA_KEY), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt','decrypt']);
}
function b64u(arr){ return btoa(String.fromCharCode(...arr)); }
function u8(b64){ return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

export async function encryptJson(obj, env) {
  const key = await importAesKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data));
  return `enc:v1:${b64u(iv)}:${b64u(ct)}`;
}

export async function decryptMaybe(str, env) {
  if (typeof str !== 'string') return null;
  if (!str.startsWith('enc:v1:')) return null;
  const key = await importAesKey(env);
  const parts = str.split(':');
  if (parts.length !== 4) return null;
  const iv = u8(parts[2]);
  const ct = u8(parts[3]);
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct);
  const json = new TextDecoder().decode(pt);
  return JSON.parse(json);
}


export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:CORS });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status:405, headers:CORS });

  try {
    const { username } = await request.json();
    const key = String(username||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    if (!key) return new Response('아이디를 입력하세요.', { status:400, headers:CORS });
    if (await env.USERS.get(key)) return new Response('이미 존재하는 아이디입니다.', { status:409, headers:CORS });

    const secVal = await env.SECURITY.get('adminid');
    if (secVal) {
      try {
        const adminObj = await decryptMaybe(secVal, env) || JSON.parse(secVal);
        const admins = adminObj && adminObj.admins && Array.isArray(adminObj.admins) ? adminObj.admins : [];
        if (admins.find(a => String(a.username||'').toLowerCase().trim()===key)) {
          return new Response('이미 존재하는 아이디입니다.', { status:409, headers:CORS });
        }
      } catch { /* ignore */ }
    }
    return new Response('사용 가능한 아이디입니다.', { status:200, headers:CORS });
  } catch (e) {
    return new Response('요청 본문 오류', { status:400, headers:CORS });
  }
}
