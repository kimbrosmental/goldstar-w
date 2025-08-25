// session-guard.js
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
      if (u.pathname === '/api/login' && req.method === 'POST') {
        const clone = res.clone();
        let data = null; try { data = await clone.json(); } catch {}
        if (res.ok && data && data.ok) setSession({ username:data.username, role:data.role, status:data.status||'active' });
        else if (data && data.error) setSession(null);
      }
    } catch {}
    return res;
  };

  function updateNav(){
    const sess = getSession();
    const isLoggedIn = !!(sess && sess.username && sess.status !== 'inactive');
    const show = (sel, v)=>document.querySelectorAll(sel).forEach(el=>{ el.style.display = v ? '' : 'none'; });
    show('.nav-login, #loginNav, [data-nav=login]', !isLoggedIn);
    show('.nav-signup, #signupNav, [data-nav=signup]', !isLoggedIn);
    show('.nav-logout, #logoutNav, [data-nav=logout]', isLoggedIn);
    show('.nav-myinfo, #myInfoNav, [data-nav=myinfo]', isLoggedIn);

    if (isLoggedIn) {
      ['#langMenu','.language','.language-menu','.translate','.i18n','#translate','[data-nav=lang]']
        .forEach(sel=>document.querySelectorAll(sel).forEach(el=> el.style.display='none'));
    }
    const myInfo = document.querySelector('.nav-myinfo a, #myInfoNav a, [data-nav=myinfo] a') || document.querySelector('#myInfoNav');
    if (isLoggedIn) {
      if (myInfo) { myInfo.setAttribute('href','/profile.html'); }
      if (!myInfo) {
        const nav = document.querySelector('nav, #nav, header');
        if (nav) {
          const a = document.createElement('a');
          a.href = '/profile.html'; a.textContent = '내 정보'; a.className = 'nav-myinfo'; a.style.marginLeft = '12px';
          nav.appendChild(a);
        }
      }
    }
  }
  window.addEventListener('DOMContentLoaded', updateNav);
  window.addEventListener('pageshow', updateNav);
  window.GSApp = window.GSApp || {}; window.GSApp.getSession = getSession; window.GSApp.setSession = setSession;
})();
