// functions/api/iprules.js
export async function onRequest(context) {
  const kv = context.env.SECURITY;
  const method = context.request.method;

  async function getAll() {
    const raw = await kv.get("iprules");
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  if (method === 'GET') {
    const data = await getAll();
    return Response.json({ ok:true, data });
  }

  if (method === 'POST') {
    try {
      const body = await context.request.json();
      await kv.put("iprules", JSON.stringify(body.data || []));
      const data = await getAll();
      return Response.json({ ok:true, data });
    } catch (e) {
      return Response.json({ ok:false, error:e.message }, { status:400 });
    }
  }

  return Response.json({ ok:false, error:"Method Not Allowed" }, { status:405 });
}
