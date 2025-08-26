export async function onRequest({ request, env }) {
  const kv = env.ORDERS;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  if (request.method === "GET") {
    const raw = await kv.get("orders");
    return new Response(raw || "[]", { headers: { ...cors, "Content-Type": "application/json" } });
  }

  if (request.method === "POST") {
    const body = await request.json();
    await kv.put("orders", JSON.stringify(body));
    return new Response("ok", { headers: cors });
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
