export async function onRequest({ request, env }) {
  const kv = env.SECURITY;

  if (request.method === 'GET') {
    try {
      const raw = await kv.get('admins');
      const adminid = await kv.get('adminid');
      if (raw) {
        return new Response(JSON.stringify({ data: raw, adminid }), { status: 200 });
      }
      // fallback: 키 전체 스캔
      const list = [];
      const keys = await kv.list();
      for (const key of keys.keys) {
        const admin = await kv.get(key.name);
        if (admin) {
          try { list.push(JSON.parse(admin)); } catch { }
        }
      }
      return new Response(JSON.stringify(list), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: "KV read error", details: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const { data, adminid } = await request.json();
      if (!data) return new Response('Missing data', { status: 400 });
      await kv.put('admins', data);
      if (adminid) await kv.put('adminid', adminid);
      return new Response('ok', { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: "KV write error", details: e.message }), { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
