
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


// --- Password verify helpers -----------------------------------------------
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function isHex64(s){ return typeof s==='string' && /^[a-f0-9]{64}$/i.test(s); }
function isBase64(s){ return typeof s==='string' && s.length%4===0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s); }
async function pbkdf2Verify(stored, input){
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iters = parseInt(parts[1], 10); if (!iters || iters < 50000) return false;
  const salt = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
  const want = parts[3];
  const mat = await crypto.subtle.importKey('raw', new TextEncoder().encode(input), { name:'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations: iters }, mat, 32*8);
  const got = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return got === want;
}
async function verifyAny(stored, input){
  if (stored == null) return false;
  if (stored === input) return true; // legacy plain (not recommended)
  if (typeof stored === 'string' && stored.startsWith('pbkdf2$')) return pbkdf2Verify(stored, input);
  if (typeof stored === 'string' && stored.startsWith('sha256:')) { const hex=await sha256Hex(input); return stored.slice(7).toLowerCase()===hex.toLowerCase(); }
  if (typeof stored === 'string' && isHex64(stored))            { const hex=await sha256Hex(input); return stored.toLowerCase()===hex.toLowerCase(); }
  if (typeof stored === 'string' && isBase64(stored))            { try{ return atob(stored)===input; }catch{ return false; } }
  if (typeof stored === 'string') { try{ const obj=JSON.parse(stored); if (obj && obj.password) return verifyAny(obj.password, input); }catch{} }
  return false;
}


function normId(s) { return String(s||'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase().trim(); }

export async function onRequest({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST')   return new Response(JSON.stringify({ error:'Method Not Allowed' }), { status:405, headers:CORS });

  try {
    const body = await request.json();
    const id = normId(body.username);
    const pw = String(body.password||'').trim();
    if (!id || !pw) return new Response(JSON.stringify({ error:'아이디/비밀번호를 입력하세요.' }), { status:400, headers:CORS });

    // 1) ADMIN via SECURITY.adminid (supports ('id', 'pw', 'role', 'active')) or arrays, or SECURITY.get('admin:<id>')
    if (env.SECURITY) {
      // per-admin key takes priority
      const perKey = await env.SECURITY.get('admin:'+id);
      if (perKey) {
        let rec = null;
        try { rec = JSON.parse(perKey); } catch { rec = perKey; }
        let role = 'ADMIN', statusActive = true, stored = rec;
        if (rec && typeof rec === 'object') {
          role = (String(rec.role||'ADMIN').toUpperCase()==='MANAGER') ? 'MANAGER':'ADMIN';
          statusActive = ('active' in rec) ? !!rec.active : (String(rec.status||'active').toLowerCase()==='active');
          stored = rec.pw || rec.password || '';
        }
        const ok = await verifyAny(stored, pw);
        if (!ok) return new Response(JSON.stringify({ error:'비밀번호가 일치하지 않습니다.' }), { status:401, headers:CORS });
        if (!statusActive) return new Response(JSON.stringify({ error:'비활성된 계정입니다. 최고관리자에게 확인 바랍니다.' }), { status:403, headers:CORS });
        return new Response(JSON.stringify({ ok:true, role, username:id, status:'active' }), { status:200, headers:CORS });
      }

      const secVal = await env.SECURITY.get('adminid');
      if (secVal) {
        // Try encrypted JSON
        let admins = null;
        const dec = await decryptMaybe(secVal, env);
        if (dec) {
          if (Array.isArray(dec)) admins = dec;
          else if (Array.isArray(dec.admins)) admins = dec.admins;
          else if (dec.id && (dec.pw || dec.password)) admins = [dec];
        }
        // Try plain JSON
        if (!admins) { 
          try {
            const obj = JSON.parse(secVal);
            if (Array.isArray(obj)) admins = obj;
            else if (Array.isArray(obj.admins)) admins = obj.admins;
            else if (obj.id && (obj.pw || obj.password)) admins = [obj]; // ★ 네가 준 형식
            else if (obj.username && (obj.password||obj.pw)) admins = [obj];
            else if (obj && typeof obj.admins === 'object') {
              admins = Object.entries(obj.admins).map(([u,rec])=>({ username:u, ...(rec||{}) }));
            }
          } catch { /* ignore */ }
        }
        if (admins) {
          const adm = admins.find(a => normId(a.username || a.id) === id);
          if (adm) {
            const role = (String((adm.role||'ADMIN')).toUpperCase()==='MANAGER') ? 'MANAGER':'ADMIN';
            const active = ('active' in adm) ? !!adm.active : (String(adm.status||'active').toLowerCase()==='active');
            const stored = adm.pw || adm.password || '';
            const ok = await verifyAny(stored, pw);
            if (!ok) return new Response(JSON.stringify({ error:'비밀번호가 일치하지 않습니다.' }), { status:401, headers:CORS });
            if (!active) return new Response(JSON.stringify({ error:'비활성된 계정입니다. 최고관리자에게 확인 바랍니다.' }), { status:403, headers:CORS });
            return new Response(JSON.stringify({ ok:true, role, username:id, status:'active' }), { status:200, headers:CORS });
          }
        } else {
          // Treat as single admin 'adminid' with stored password (string or JSON)
          try {
            const single = JSON.parse(secVal);
            if (normId(single.id||single.username) === id) {
              const active = ('active' in single) ? !!single.active : (String(single.status||'active').toLowerCase()==='active');
              const ok = await verifyAny(single.pw||single.password||'', pw);
              if (!ok) return new Response(JSON.stringify({ error:'비밀번호가 일치하지 않습니다.' }), { status:401, headers:CORS });
              if (!active) return new Response(JSON.stringify({ error:'비활성된 계정입니다. 최고관리자에게 확인 바랍니다.' }), { status:403, headers:CORS });
              return new Response(JSON.stringify({ ok:true, role:(String(single.role||'ADMIN').toUpperCase()==='MANAGER')?'MANAGER':'ADMIN', username:id, status:'active' }), { status:200, headers:CORS });
            }
          } catch {
            if (id === 'adminid' && await verifyAny(secVal, pw)) {
              return new Response(JSON.stringify({ ok:true, role:'ADMIN', username:id, status:'active' }), { status:200, headers:CORS });
            }
          }
        }
      }
    }

    // 2) Bootstrap admin via env
    const bootId = (env.ADMIN_ID||'').toLowerCase().trim();
    const bootPw = String(env.ADMIN_PW||'').trim();
    if (bootId && bootPw && id===bootId && pw===bootPw) {
      return new Response(JSON.stringify({ ok:true, role:'ADMIN', username:id, status:'active' }), { status:200, headers:CORS });
    }

    // 3) Normal user
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
