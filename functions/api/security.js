export async function onRequest({ request, env }) {
  const kv = env.SECURITY;
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); 
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  // -----------------------------
  // 금시세 (goldprice)
  if (type === "goldprice") {
    if (request.method === "GET") {
      const raw = await kv.get("goldprice");
      return new Response(raw || "{}", { headers: cors });
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
      const raw = await kv.get("admins");
      const adminid = await kv.get("adminid");
      if (raw) {
        return new Response(JSON.stringify({ data: raw, adminid }), { status: 200, headers: cors });
      } else {
        return new Response(JSON.stringify({ data: "[]", adminid: null }), { status: 200, headers: cors });
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
      const raw = await kv.get("iprules");
      return new Response(raw || "[]", { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("iprules", JSON.stringify(body.rules || []));
      return new Response("ok", { headers: cors });
    }
  }

  return new Response("Bad Request", { status: 400, headers: cors });
}
