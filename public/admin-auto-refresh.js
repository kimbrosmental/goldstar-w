
// admin-auto-refresh.js — lightweight auto refresh for admin pages
(function(){
  if (typeof window === 'undefined') return;
  const KEY = 'gs_admin_versions';
  const PATHS_RELOAD = [/\/admin/i, /\/dashboard/i, /\/manage/i];

  function shouldAuto(page){
    return PATHS_RELOAD.some(rx=>rx.test(page));
  }

  function getCache(){ try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } }
  function setCache(v){ sessionStorage.setItem(KEY, JSON.stringify(v)); }

  async function fetchJSON(url){
    const r = await fetch(url, { cache:'no-store' });
    if (!r.ok) throw new Error('http '+r.status);
    return r.json();
  }

  async function tick(){
    try {
      const ver = await fetchJSON('/api/admin/version');
      const old = getCache();
      if (!old) { setCache(ver); return; }

      const changed = ['users','orders','inquiries','security'].some(k => (old[k]||'') !== (ver[k]||''));
      if (changed && shouldAuto(location.pathname)) {
        location.reload();
        return;
      }

      // Dashboard live numbers (best-effort if present)
      const el = document.querySelector('#gs-dashboard');
      if (el) {
        const d = await fetchJSON('/api/admin/dashboard');
        const map = {
          'users-total': d?.users?.total,
          'users-approved': d?.users?.approved,
          'users-pending': d?.users?.pending,
          'users-rejected': d?.users?.rejected,
          'orders-total': d?.orders?.total,
          'inquiries-total': d?.inquiries?.total
        };
        Object.entries(map).forEach(([k,val])=>{
          const target = el.querySelector(`[data-gs="${k}"]`);
          if (target) target.textContent = (val==null?'-':String(val));
        });
      }

      setCache(ver);
    } catch (e) {
      // ignore
    }
  }

  function start(){
    tick();
    setInterval(tick, 5000);
  }

  window.addEventListener('pageshow', start, { once:true });
})();
