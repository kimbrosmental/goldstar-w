export async function onRequest({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  if (request.method === "POST") {
    try {
      const { username } = await request.json();
      const key = String(username || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim();
      if (!key) {
        return new Response("아이디가 비어있습니다.", { status: 400, headers: cors });
      }

      // -------------------------
      // 1) 일반 회원 검사 (USERS KV)
      // -------------------------
      const existsUser = await env.USERS.get(key);
      if (existsUser) {
        return new Response("이미 존재하는 아이디입니다.", { status: 200, headers: cors });
      }

      // -------------------------
      // 2) 관리자 계정 검사 (SECURITY.adminid)
      // -------------------------
      try {
        const rawAdmin = await env.SECURITY.get("adminid");
        if (rawAdmin) {
          const admin = JSON.parse(rawAdmin);
          if (admin.id && admin.id.toLowerCase().trim() === key) {
            return new Response("이미 존재하는 아이디입니다.", { status: 200, headers: cors });
          }
        }
      } catch (e) {
        // SECURITY 파싱 실패 시 무시
      }

      // -------------------------
      // 사용 가능
      // -------------------------
      return new Response("사용 가능한 아이디입니다.", { status: 200, headers: cors });

    } catch (err) {
      return new Response("잘못된 요청입니다.", { status: 400, headers: cors });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
