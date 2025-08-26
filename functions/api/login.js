// functions/api/login.js
// 관리자: SECURITY.adminid / 유저: USERS
// export onRequest는 단 하나만!

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function verifyPassword(stored, input) {
  if (!stored || !input) return false;
  const s = String(stored).trim();
  const p = String(input).trim();
  if (!s || !p) return false;

  // plain
  if (s === p) return true;

  // sha256:abcdef...
  if (s.startsWith("sha256:")) {
    const hex = await sha256Hex(p);
    return s.slice(7).toLowerCase() === hex.toLowerCase();
  }

  // pbkdf2$iter$salt$hash
  if (s.startsWith("pbkdf2$")) {
    try {
      const parts = s.split("$");
      const iterations = parseInt(parts[1], 10);
      const salt = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
      const want = parts[3];
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(p), {name:"PBKDF2"}, false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({name:"PBKDF2", hash:"SHA-256", salt, iterations}, key, 32*8);
      const got = btoa(String.fromCharCode(...new Uint8Array(bits)));
      return got === want;
    } catch { return false; }
  }

  return false;
}

export async function onRequest({ request, env }) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return new Response(JSON.stringify({ ok:false, error:"Method Not Allowed" }), { status:200, headers:CORS });

  try {
    const { username, password } = await request.json();
    const id = String(username||"").replace(/[^a-zA-Z0-9]/g,"").toLowerCase().trim();
    const pw = String(password||"").trim();
    if (!id || !pw) {
      return new Response(JSON.stringify({ ok:false, error:"아이디/비밀번호를 입력하세요." }), { status:200, headers:CORS });
    }

    // 1. 관리자 검사
    try {
      const secVal = env.SECURITY ? await env.SECURITY.get("adminid") : null;
      if (secVal) {
        let admins = null;
        try { const parsed = JSON.parse(secVal); if (Array.isArray(parsed.admins)) admins = parsed.admins; } catch {}
        if (admins) {
          const found = admins.find(a => String(a.username||"").toLowerCase().trim() === id);
          if (found) {
            if (String(found.status||"active") !== "active") {
              return new Response(JSON.stringify({ ok:false, error:"비활성된 계정입니다. 최고관리자에게 확인 바랍니다." }), { status:200, headers:CORS });
            }
            const ok = await verifyPassword(found.password, pw);
            if (!ok) return new Response(JSON.stringify({ ok:false, error:"비밀번호가 일치하지 않습니다." }), { status:200, headers:CORS });
            const role = (String(found.role||"ADMIN").toUpperCase()==="MANAGER") ? "MANAGER" : "ADMIN";
            return new Response(JSON.stringify({ ok:true, role, username:id, status:"active" }), { status:200, headers:CORS });
          }
        }
      }
    } catch {}

    // 2. 일반 유저 검사
    const raw = await env.USERS.get(id);
    if (!raw) return new Response(JSON.stringify({ ok:false, error:"존재하지 않는 아이디입니다." }), { status:200, headers:CORS });

    let user;
    try { user = JSON.parse(raw); }
    catch { return new Response(JSON.stringify({ ok:false, error:"서버 데이터 오류" }), { status:200, headers:CORS }); }

    const ok = await verifyPassword(user.password, pw);
    if (!ok) return new Response(JSON.stringify({ ok:false, error:"비밀번호가 일치하지 않습니다." }), { status:200, headers:CORS });

    const role = user.role || "USER";
    const status = user.status || "active";
    return new Response(JSON.stringify({ ok:true, role, username:id, status }), { status:200, headers:CORS });

  } catch {
    return new Response(JSON.stringify({ ok:false, error:"요청 본문 오류" }), { status:200, headers:CORS });
  }
}
