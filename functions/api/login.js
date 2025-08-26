export async function onRequest({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "Method Not Allowed" }), { status: 405, headers: cors });

  try {
    const { username, password } = await request.json();
    const id = String(username || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim();
    const pw = String(password || "").trim();

    if (!id || !pw) {
      return new Response(JSON.stringify({ ok: false, error: "아이디/비밀번호를 입력하세요." }), { status: 400, headers: cors });
    }

    // KV에서 사용자 조회
    const raw = await env.USERS.get(id);
    if (!raw) {
      return new Response(JSON.stringify({ ok: false, error: "존재하지 않는 아이디입니다." }), { status: 404, headers: cors });
    }

    let user;
    try { user = JSON.parse(raw); } catch { return new Response(JSON.stringify({ ok: false, error: "서버 데이터 오류" }), { status: 500, headers: cors }); }

    // 비밀번호 검증 (단순 평문 버전)
    if (user.password !== pw) {
      return new Response(JSON.stringify({ ok: false, error: "비밀번호가 일치하지 않습니다." }), { status: 401, headers: cors });
    }

    // 로그인 성공
    return new Response(JSON.stringify({ ok: true, role: user.role || "USER", username: id, status: user.status || "active" }), { status: 200, headers: cors });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "요청 처리 오류" }), { status: 400, headers: cors });
  }
}
