
export async function onRequest({ request, env }) {
  const cors = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' };
  // Users
  let users = [], uApproved=0, uPending=0, uRejected=0;
  try {
    let cursor;
    do {
      const r = await env.USERS.list({ cursor });
      cursor = r.cursor;
      for (const k of r.keys) {
        if (k.name.startsWith('_') || k.name.startsWith('ver:')) continue;
        const raw = await env.USERS.get(k.name);
        if (raw) {
          try {
            const obj = JSON.parse(raw);
            users.push(obj);
            const s = String(obj.status||'').toLowerCase();
            if (s==='approved' || s==='active') uApproved++;
            else if (s==='rejected') uRejected++;
            else uPending++;
          } catch { users.push({}); }
        }
      }
    } while (cursor);
  } catch { users = []; }

  // Orders
  let ordersCount = 0;
  try { const raw = await env.ORDERS.get('orders'); const arr = raw?JSON.parse(raw):[]; if (Array.isArray(arr)) ordersCount = arr.length; } catch {}

  // Inquiries
  let inqCount = 0;
  try {
    let cursor;
    do {
      const r = await env.INQUIRIES.list({ prefix:'inq:', cursor });
      cursor = r.cursor;
      inqCount += (r.keys||[]).length;
    } while (cursor);
  } catch {}

  // Versions
  const vers = {};
  for (const n of ['users','orders','inquiries','security']) {
    try { vers[n] = await env.SECURITY.get('ver:'+n) || null; } catch { vers[n] = null; }
  }

  const result = {
    users: { total: users.length, approved: uApproved, pending: uPending, rejected: uRejected },
    orders: { total: ordersCount },
    inquiries: { total: inqCount },
    versions: vers,
    ts: Date.now()
  };
  return new Response(JSON.stringify(result), { headers: cors });
}
