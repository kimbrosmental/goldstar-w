export async function onRequest(context) {
  const kv = context.env.ORDERS;
  const method = context.request.method;

  async function getAll() {
    const list = await kv.list();
    const data = [];
    for (const key of list.keys) {
      const val = await kv.get(key.name);
      if (val) data.push(JSON.parse(val));
    }
    return data;
  }

  if (method === 'GET') {
    const data = await getAll();
    return Response.json({ ok:true, data });
  }

  if (method === 'POST') {
    try {
      const body = await context.request.json();
      const { id, action, updateData } = body;
      const key = id ? String(id).toLowerCase().trim() : null;

      if (action === 'delete' && key) {
        await kv.delete(key);
      } else if (key && updateData) {
        await kv.put(key, JSON.stringify(updateData));
      }

      const data = await getAll();
      return Response.json({ ok:true, data });
    } catch (e) {
      return Response.json({ ok:false, error:e.message }, { status:400 });
    }
  }

  return Response.json({ ok:false, error:"Method Not Allowed" }, { status:405 });
}
