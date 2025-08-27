export async function onRequest({ request, env }) {
  const kv = env.SECURITY;
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); 
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  // -----------------------------
  // 금시세 (goldprice)
  if (type === "goldprice") {
    if (request.method === "GET") {
      return new Response(await kv.get("goldprice") || "{}", { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("goldprice", JSON.stringify(body));
      return new Response("ok", { headers: cors });
    }
  }

  // -----------------------------
  // 관리자 계정 관리 (admins + adminid)
  if (type === "admin") {
    if (request.method === "GET") {
      const raw = await kv.get("admins");      // 암호화된 전체 관리자 배열
      const adminid = await kv.get("adminid"); // 개별 관리자 기본 계정
      if (raw) {
        return new Response(JSON.stringify({ data: raw, adminid }), { status: 200, headers: cors });
      } else {
        // fallback: 전체 KV 스캔
        const list = [];
        for await (const key of kv.list()) {
          const admin = await kv.get(key.name);
          if (admin) list.push(JSON.parse(admin));
        }
        return new Response(JSON.stringify(list), { status: 200, headers: cors });
      }
    }

    if (request.method === "POST") {
      const { data, adminid } = await request.json();
      if (!data) return new Response("Missing data", { status: 400, headers: cors });

      await kv.put("admins", data);
      if (adminid) await kv.put("adminid", adminid);

      return new Response("ok", { status: 200, headers: cors });
    }
  }

  // -----------------------------
  // IP 접근 관리 (iprules)
  if (type === "iprules") {
    if (request.method === "GET") {
      return new Response(await kv.get("iprules") || "[]", { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("iprules", JSON.stringify(body.rules || []));
      return new Response("ok", { headers: cors });
    }
  }

  return new Response("Bad Request", { status: 400, headers: cors });
}
