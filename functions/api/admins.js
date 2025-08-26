// functions/api/admins.js
export async function onRequest({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  const kv = env.SECURITY;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (request.method === "GET") {
      // "adminid" 또는 "admins" 키 지원
      let admins = [];
      const raw = await kv.get("admins");
      const single = await kv.get("adminid");

      if (raw) {
        try { admins = JSON.parse(raw); } catch { admins = []; }
      } else if (single) {
        try { admins = JSON.parse(single); } catch { admins = []; }
      }

      if (!Array.isArray(admins)) admins = [admins];
      return new Response(JSON.stringify(admins), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      let admins = [];
      const raw = await kv.get("admins");
      if (raw) {
        try { admins = JSON.parse(raw); } catch { admins = []; }
      }
      admins.push(body);
      await kv.put("admins", JSON.stringify(admins));
      return new Response("ok", { status: 200, headers: cors });
    }

    if (request.method === "PUT") {
      const body = await request.json();
      let admins = [];
      const raw = await kv.get("admins");
      if (raw) {
        try { admins = JSON.parse(raw); } catch { admins = []; }
      }
      admins = admins.map(a => a.id === body.id ? body : a);
      await kv.put("admins", JSON.stringify(admins));
      return new Response("updated", { status: 200, headers: cors });
    }

    if (request.method === "DELETE") {
      const { id } = await request.json();
      let admins = [];
      const raw = await kv.get("admins");
      if (raw) {
        try { admins = JSON.parse(raw); } catch { admins = []; }
      }
      admins = admins.filter(a => a.id !== id);
      await kv.put("admins", JSON.stringify(admins));
      return new Response("deleted", { status: 200, headers: cors });
    }

    return new Response("Method Not Allowed", { status: 405, headers: cors });
  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500, headers: cors });
  }
}
