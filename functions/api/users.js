export async function onRequest({ request, env }) {
  const kv = env.USERS;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });

  // 전체 목록 조회
  if (request.method === "GET") {
    const list = await kv.list();
    const items = [];
    for (const key of list.keys) {
      const val = await kv.get(key.name);
      if (val) {
        try {
          items.push(JSON.parse(val));
        } catch {
          items.push({ key: key.name, raw: val });
        }
      }
    }
    return new Response(JSON.stringify(items), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // 새 회원 추가
  if (request.method === "POST") {
    const data = await request.json();
    const key = data.username || `user_${Date.now()}`;
    await kv.put(key, JSON.stringify({ ...data, created: new Date().toISOString() }));
    return new Response("created", { headers: cors });
  }

  // 회원 수정
  if (request.method === "PUT") {
    const data = await request.json();
    const key = data.username;
    if (!key) {
      return new Response("username required", { status: 400, headers: cors });
    }
    await kv.put(key, JSON.stringify(data));
    return new Response("updated", { headers: cors });
  }

  // 회원 삭제
  if (request.method === "DELETE") {
    const { username } = await request.json();
    if (!username) {
      return new Response("username required", { status: 400, headers: cors });
    }
    await kv.delete(username);
    return new Response("deleted", { headers: cors });
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
