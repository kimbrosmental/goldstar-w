export async function onRequest({ request, env }) {
  const kv = env.INQUIRIES;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  if (request.method === "GET") {
    const list = await kv.list();
    const items = [];
    for (const key of list.keys) {
      const val = await kv.get(key.name);
      if (val) items.push(JSON.parse(val));
    }
    return new Response(JSON.stringify(items), { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (request.method === "POST") {
    const data = await request.json();
    const key = `inq_${Date.now()}`;
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
