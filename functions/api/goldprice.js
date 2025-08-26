export async function onRequest({ request, env }) {
  const kv = env.SECURITY;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  if (request.method === "POST") {
    try {
      const body = await request.json();
      // 프론트엔드에서 { manualGoldPrice: 값 } 형태로 전송함
      if (typeof body.manualGoldPrice === 'undefined') {
        return new Response(JSON.stringify({ error: 'manualGoldPrice required' }), { status: 400, headers: cors });
      }
  // goldprice 키에 값 저장, 숫자만 허용
  const value = String(Number(body.manualGoldPrice));
  await kv.put('goldprice', value);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
    }
  }

  if (request.method === "GET") {
    try {
  const value = await kv.get('goldprice');
  return new Response(JSON.stringify({ manualGoldPrice: value || '' }), { status: 200, headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
