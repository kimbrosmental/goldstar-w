export async function onRequest({ request, env }) {
  const kv = env.LOG;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });

  // 전체 로그 목록 조회
  if (request.method === "GET") {
    const raw = await kv.get("logs");
    let logs = [];
    try { logs = JSON.parse(raw) || []; } catch { logs = []; }
    return new Response(JSON.stringify({ data: logs }), { headers: cors });
  }

  // 로그 추가/전체 저장
  if (request.method === "POST") {
    const body = await request.json();
    // 단건 추가: { log: {...} }
    // 전체 저장: { data: [...] }
    let logs = [];
    const raw = await kv.get("logs");
    try { logs = JSON.parse(raw) || []; } catch { logs = []; }
    if (body.log) {
      logs.push(body.log);
    } else if (Array.isArray(body.data)) {
      logs = body.data;
    }
    await kv.put("logs", JSON.stringify(logs));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  // 로그 삭제 (idx 또는 id 기반)
  if (request.method === "DELETE") {
    const body = await request.json();
    let logs = [];
    const raw = await kv.get("logs");
    try { logs = JSON.parse(raw) || []; } catch { logs = []; }
    if (typeof body.idx === 'number') {
      logs.splice(body.idx, 1);
    } else if (body.id) {
      logs = logs.filter(l => l.id !== body.id);
    }
    await kv.put("logs", JSON.stringify(logs));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  return new Response("Method Not Allowed", { status: 405, headers: cors });
}
