

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


// pbkdf2 verifier
async function pbkdf2Verify(stored, input) {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iters = parseInt(parts[1], 10);
  if (!iters || iters < 50000) return false;
  const salt = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
  const want = parts[3];
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(input), { name:'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations: iters }, keyMaterial, 32*8);
  const got = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return got === want;
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function isHex64(s){ return typeof s==='string' && /^[a-f0-9]{64}$/i.test(s); }
function isBase64(s){ return typeof s==='string' && s.length%4===0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s); }

async function verifyAny(stored, input) {
  if (stored == null) return false;
  if (typeof stored === 'string' && stored.startsWith('pbkdf2$')) return pbkdf2Verify(stored, input);
  if (typeof stored === 'string' && stored.startsWith('sha256:')) { const h=await sha256Hex(input); return stored.slice(7).toLowerCase()===h.toLowerCase(); }
  if (typeof stored === 'string' && isHex64(stored)) { const h=await sha256Hex(input); return stored.toLowerCase()===h.toLowerCase(); }
  if (typeof stored === 'string' && isBase64(stored)) { try{ return atob(stored)===input; }catch{ return false; } }
  if (typeof stored === 'string') { // try JSON wrapper
    try { const obj = JSON.parse(stored); if (obj && obj.password) return verifyAny(obj.password, input); } catch {}
  }
  return stored === input;
}

export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS });
  try {
    const body = await request.json();
    const id = String(body.username||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim();
    const pw = String(body.password||'').trim();
    if (!id || !pw) return new Response(JSON.stringify({ error:'아이디/비밀번호를 입력하세요.' }), { status:400, headers:CORS });

    // --- ADMIN path: decrypt SECURITY 'adminid' (enc JSON with admins[])
    if (env.SECURITY) {
      const secVal = await env.SECURITY.get('adminid');
      if (secVal) {
        let admins = null;

        // New encrypted format
        try { const dec = await decryptMaybe(secVal, env); if (dec && Array.isArray(dec.admins)) admins = dec.admins; } catch { }
        // Legacy JSON format with admins array (not encrypted)
        if (!admins) { try { const obj = JSON.parse(secVal); if (obj && Array.isArray(obj.admins)) admins = obj.admins; } catch { } }

        if (admins) {
          const found = admins.find(a => String(a.username||'').toLowerCase().trim()===id);
          if (found) {
            const active = (String(found.status||'active').toLowerCase()==='active');
            if (!active) return new Response(JSON.stringify({ error:'비활성된 계정입니다. 최고관리자에게 확인 바랍니다.' }), { status:403, headers:CORS });
            const ok = await verifyAny(found.password||'', pw);
            if (!ok) return new Response(JSON.stringify({ error:'비밀번호가 일치하지 않습니다.' }), { status:401, headers:CORS });
            const role = (String(found.role||'ADMIN').toUpperCase()==='MANAGER') ? 'MANAGER' : 'ADMIN';
            return new Response(JSON.stringify({ ok:true, role, username:id, status:'active' }), { status:200, headers:CORS });
          }
        }
      }
    }

    // --- Bootstrap env admin (optional)
    const bootId = (env.ADMIN_ID||'').toLowerCase().trim();
    const bootPw = String(env.ADMIN_PW||'').trim();
    if (bootId && bootPw && id===bootId && pw===bootPw) {
      return new Response(JSON.stringify({ ok:true, role:'ADMIN', username:id, status:'active' }), { status:200, headers:CORS });
    }

    // --- Normal user path (USERS KV)
    const raw = await env.USERS.get(id);
    if (!raw) return new Response(JSON.stringify({ error:'존재하지 않는 아이디입니다.' }), { status:404, headers:CORS });
    let user; try { user = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error:'서버 데이터 오류' }), { status:500, headers:CORS }); }
    const ok = await verifyAny(user.password||'', pw);
    if (!ok) return new Response(JSON.stringify({ error:'비밀번호가 일치하지 않습니다.' }), { status:401, headers:CORS });
    const role = user.role||'USER'; const status = user.status||'active';
    return new Response(JSON.stringify({ ok:true, role, username:id, status }), { status:200, headers:CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error:'요청 본문 오류' }), { status:400, headers:CORS });
  }
}
