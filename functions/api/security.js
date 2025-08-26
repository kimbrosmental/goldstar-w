// functions/api/security.js
export async function onRequest({ request, env }) {
  const kv = env.SECURITY;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);

  // ✅ 관리자 계정 관리
  if (url.pathname.endsWith("/admin")) {
    if (request.method === "GET") {
      const raw = await kv.get("adminid");
      return new Response(raw || "{}", { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("adminid", JSON.stringify(body));
      return new Response("ok", { headers: cors });
    }
    if (request.method === "DELETE") {
      await kv.delete("adminid");
      return new Response("deleted", { headers: cors });
    }
  }

  // ✅ IP 접근 관리
  if (url.pathname.endsWith("/ip")) {
    if (request.method === "GET") {
      const raw = await kv.get("ipRules");
      return new Response(raw || "[]", { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (request.method === "POST") {
      const body = await request.json();
      const rules = Array.isArray(body) ? body : [];
      await kv.put("ipRules", JSON.stringify(rules));
      return new Response("ok", { headers: cors });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
