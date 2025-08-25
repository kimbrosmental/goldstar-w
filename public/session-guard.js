
// session-guard.js (fixed)
(function(){
  if (typeof window === 'undefined') return;
  const LS_KEY = 'gs_user';

  function getSession(){ try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; } }
  function setSession(sess){ if (!sess) localStorage.removeItem(LS_KEY); else localStorage.setItem(LS_KEY, JSON.stringify(sess)); }

  const _fetch = window.fetch.bind(window);
  window.fetch = async function(input, init){
    const res = await _fetch(input, init);
    try {
      const req = new Request(input, init);
      const u = new URL(req.url, location.origin);
      if (u.pathname === '/api/login' && res.ok) {
        const cloned = res.clone();
        const json = await cloned.json().catch(()=>null);
        if (json && json.ok) {
          setSession({ username: json.username, role: json.role||'USER', ts: Date.now() });
          updateUI();
        }
      }
    } catch {}
    return res;
  };

  function updateUI(){
    try{
      const sess = getSession();
      const nav = document.querySelector('.topnav, nav, header');
      // Toggle language menu
      document.querySelectorAll('#lang-menu, .lang-menu, .nav-lang').forEach(el=>{
        el.style.display = sess ? 'none' : '';
      });
      // Toggle "내정보" button
      const myBtn = document.querySelector('#btn-myinfo, .btn-myinfo');
      if (myBtn) {
        if (sess) { myBtn.style.display = ''; myBtn.onclick = ()=> location.href='/profile.html'; }
        else { myBtn.style.display = 'none'; }
      }
    }catch{}
  }

  function observe(){
    updateUI();
    const mo = new MutationObserver(()=>updateUI());
    mo.observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('pageshow', updateUI);
    window.addEventListener('DOMContentLoaded', updateUI);
  }
  observe();

  window.GSApp = window.GSApp || {};
  window.GSApp.getSession = getSession;
  window.GSApp.setSession = setSession;
})();
