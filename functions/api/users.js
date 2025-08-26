export async function onRequest({ request, env }) {
  const kv = env.USERS;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") 
    return new Response(null, { status: 204, headers: cors });

  if (request.method === "GET") {
    try {
      const list = await kv.list();
      const items = [];
      for (const key of list.keys) {
        const val = await kv.get(key.name);
        if (val) {
          try {
            items.push(JSON.parse(val));
          } catch {
            // JSON 파싱 실패 시 문자열 그대로 push
            items.push({ key: key.name, raw: val });
          }
        }
      }
      return new Response(JSON.stringify(items), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "KV 조회 실패", detail: e.message }), {
        status: 500,
        headers: cors
      });
    }
  }

  if (request.method === "POST") {
    const data = await request.json();
    const key = (data.username || `user_${Date.now()}`);
    await kv.put(key, JSON.stringify(data));
    return new Response("ok", { headers: cors });
  }

  if (request.method === "DELETE") {
    const { id } = await request.json();
    await kv.delete(id);
    return new Response("deleted", { headers: cors });
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
