export async function onRequest({ request, env }) {
  const kv = env.USERS;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method === "GET") {
    // 전체 회원 배열을 하나의 key("users_all")에 저장하는 구조
    const raw = await kv.get("users_all");
    let users = [];
    try { if (raw) users = JSON.parse(raw); } catch {}
    return new Response(JSON.stringify(users), { headers: cors });
  }

  if (request.method === "POST") {
    // 프론트에서 {data: encryptedArray} 형태로 전달
    const { data } = await request.json();
    if (!data) {
      return new Response("no data", { status: 400, headers: cors });
    }
    await kv.put("users_all", JSON.stringify(data));
    return new Response("ok", { headers: cors });
  }

  if (request.method === "DELETE") {
    // 전체 삭제
    await kv.delete("users_all");
    return new Response("deleted", { headers: cors });
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
