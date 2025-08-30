export async function onRequest({ request, env }) {
  const kv = env.SECURITY;
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); 
  const cors = { 
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json" 
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  // -----------------------------
  // 금시세 (goldprice)
  if (type === "goldprice") {
    if (request.method === "GET") {
      const value = await kv.get("goldprice");
      return new Response(JSON.stringify({ manualGoldPrice: value || '' }), { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      const price = String(Number(body.manualGoldPrice || 0));
      await kv.put("goldprice", price);
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
  }

  // -----------------------------
  // 입금 계좌 정보 (depositbank)
  if (type === "depositbank") {
    if (request.method === "GET") {
      const raw = await kv.get("depositbank");
      const data = raw ? JSON.parse(raw) : {};
      return new Response(JSON.stringify(data), { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("depositbank", JSON.stringify(body));
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
  }

  // -----------------------------
  // 관리자 계정 관리 (adminid)
  if (type === "admin") {
    if (request.method === "GET") {
      const raw = await kv.get("adminid");
      const data = raw ? JSON.parse(raw) : { admins: [] };
      return new Response(JSON.stringify(data), { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("adminid", JSON.stringify(body));
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
  }

  // -----------------------------
  // IP 접근 관리 (iprules)
  if (type === "iprules") {
    if (request.method === "GET") {
      const raw = await kv.get("iprules");
      const data = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify(data), { headers: cors });
    }
    if (request.method === "POST") {
      const body = await request.json();
      await kv.put("iprules", JSON.stringify(body.rules || []));
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
  }

  // -----------------------------
  // 기본 응답 (type 파라미터 없는 경우)
  if (!type) {
    if (request.method === "GET") {
      // 모든 보안 설정 반환
      const goldprice = await kv.get("goldprice");
      const depositbank = await kv.get("depositbank");
      const adminid = await kv.get("adminid");
      const iprules = await kv.get("iprules");
      
      return new Response(JSON.stringify({
        goldprice: goldprice || '',
        depositbank: depositbank ? JSON.parse(depositbank) : {},
        adminid: adminid ? JSON.parse(adminid) : { admins: [] },
        iprules: iprules ? JSON.parse(iprules) : []
      }), { headers: cors });
    }
  }

  return new Response("Bad Request", { status: 400, headers: cors });
}
