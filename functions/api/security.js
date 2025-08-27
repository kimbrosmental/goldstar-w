// Unified Security API (goldprice, admins, adminid, ip_rules) with strong CORS and cache-busting
export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.SECURITY;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "all";

  const origin = request.headers.get("Origin") || "*";
  const baseHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Vary": "Origin",
  };

  const json = (obj, status = 200, headers = {}) =>
    new Response(JSON.stringify(obj), { status, headers: { ...baseHeaders, ...headers } });

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: baseHeaders });
  }

  // helpers
  async function getAll() {
    const [gold, admins, adminid, ipRules] = await Promise.all([
      kv.get("goldprice", { type: "json" }),
      kv.get("admins", { type: "json" }),
      kv.get("adminid", { type: "text" }),
      kv.get("ip_rules", { type: "json" }),
    ]);
    return {
      goldprice: gold ?? {},
      admins: Array.isArray(admins) ? admins : [],
      adminid: adminid ?? "",
      ip_rules: Array.isArray(ipRules) ? ipRules : [],
    };
  }

  async function putOne(kind, body) {
    if (kind === "goldprice") {
      await kv.put("goldprice", JSON.stringify(body ?? {}));
      return;
    }
    if (kind === "admins") {
      const arr = Array.isArray(body) ? body : (Array.isArray(body?.admins) ? body.admins : []);
      await kv.put("admins", JSON.stringify(arr));
      return;
    }
    if (kind === "adminid") {
      const value = typeof body === "string" ? body : (body?.value ?? "");
      await kv.put("adminid", value);
      return;
    }
    if (kind === "ip_rules") {
      const arr = Array.isArray(body) ? body : (Array.isArray(body?.ip_rules) ? body.ip_rules : []);
      await kv.put("ip_rules", JSON.stringify(arr));
      return;
    }
    throw new Error("Unsupported type");
  }

  async function deleteOne(kind, body) {
    if (kind === "goldprice") { await kv.delete("goldprice"); return; }
    if (kind === "admins") {
      const id = body?.id;
      if (!id) { await kv.delete("admins"); }
      else {
        const cur = (await kv.get("admins", { type: "json" })) ?? [];
        const next = Array.isArray(cur) ? cur.filter(x => x?.id !== id && x?.username !== id) : [];
        await kv.put("admins", JSON.stringify(next));
      }
      return;
    }
    if (kind === "adminid") { await kv.delete("adminid"); return; }
    if (kind === "ip_rules") {
      const id = body?.id;
      if (!id) { await kv.delete("ip_rules"); }
      else {
        const cur = (await kv.get("ip_rules", { type: "json" })) ?? [];
        const next = Array.isArray(cur) ? cur.filter(x => x?.id !== id) : [];
        await kv.put("ip_rules", JSON.stringify(next));
      }
      return;
    }
    throw new Error("Unsupported type");
  }

  try {
    if (request.method === "GET") {
      if (type === "all") {
        const data = await getAll();
        return json({ ok: true, data });
      }
      const data = await getAll();
      // send subset for convenience too
      if (type in data) return json({ ok: true, data: { [type]: data[type] } });
      return json({ ok: false, error: "unknown type" }, 400);
    }

    if (request.method === "POST" || request.method === "PUT") {
      const ct = request.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? (await request.json().catch(()=>null)) : null;
      await putOne(type, body);
      const data = await getAll();
      return json({ ok: true, data });
    }

    if (request.method === "DELETE") {
      const ct = request.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? (await request.json().catch(()=>null)) : null;
      await deleteOne(type, body || {});
      const data = await getAll();
      return json({ ok: true, data });
    }

    return json({ ok: false, error: "method not allowed" }, 405);
  } catch (err) {
    return json({ ok: false, error: err?.message || "unexpected error" }, 500);
  }
}
