export async function onRequest({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return new Response("허용되지 않은 메서드입니다.", { status: 405, headers: cors });

  try {
    const { username, password } = await request.json();
    const id = String(username || "").trim().toLowerCase();
    const pw = String(password || "").trim();

    if (!id || !pw) {
      return new Response("아이디/비밀번호를 입력하세요.", { status: 400, headers: cors });
    }

    // 1) 관리자 계정 확인
    try {
      const rawAdmin = await env.SECURITY.get("adminid");
      if (rawAdmin) {
        const admin = JSON.parse(rawAdmin);
        if (admin.id && admin.id.toLowerCase() === id) {
          if (!admin.active) {
            return new Response("비활성된 계정입니다.", { status: 403, headers: cors });
          }
          // SHA-256 해시 비교
          const enc = new TextEncoder().encode(pw);
          const digest = await crypto.subtle.digest("SHA-256", enc);
          const hashHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
          if (hashHex !== admin.pw) {
            return new Response("비밀번호가 일치하지 않습니다.", { status: 401, headers: cors });
          }
          // ✅ 관리자 로그인 성공 → role 함께 전달
          return new Response(JSON.stringify({ ok: true, role: "ADMIN", username: admin.id }), { status: 200, headers: cors });
        }
      }
    } catch {}

    // 2) 일반 유저 확인
    const raw = await env.USERS.get(id);
    if (!raw) {
      return new Response("존재하지 않는 아이디입니다.", { status: 404, headers: cors });
    }

    let user;
    try { user = JSON.parse(raw); } catch {
      return new Response("서버 데이터 오류", { status: 500, headers: cors });
    }

    if (String(user.password || "").trim() !== pw) {
      return new Response("비밀번호가 일치하지 않습니다.", { status: 401, headers: cors });
    }

    // 상태별 처리
    if (user.status === 'pending') {
      return new Response(JSON.stringify({ ok: true, role: 'USER', username: id, status: 'pending', msg: '회원가입 승인 대기중입니다.' }), { status: 200, headers: cors });
    }
    if (user.status === 'rejected') {
      return new Response(JSON.stringify({ ok: true, role: 'USER', username: id, status: 'rejected', msg: '회원가입 거절입니다. 관리자에게 문의하세요!' }), { status: 200, headers: cors });
    }
    if (user.status === 'active') {
      return new Response(JSON.stringify({ ok: true, role: 'USER', username: id, status: 'active' }), { status: 200, headers: cors });
    }
    // 기타 상태
    return new Response(JSON.stringify({ ok: true, role: 'USER', username: id, status: user.status || 'unknown' }), { status: 200, headers: cors });

  } catch (e) {
    return new Response("요청 처리 오류", { status: 400, headers: cors });
  }
}
