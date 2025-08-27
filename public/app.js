// Shared application logic: encrypted user DB, auth, nav, messaging
// 개발자 모드 항상 활성화 (콘솔 디버깅)
window.DEBUG = true;

  // 서버에서 아이디 중복확인
  async function isUsernameTaken(username) {
    username = String(username).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    if (!username) return false;
  const res = await fetch('/api/dupcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (!res.ok) throw new Error('서버 오류');
    const msg = await res.text();
    return msg.includes('이미 사용중인 아이디입니다.');
  }

  // 서버에서 이메일 중복확인 (임시: 항상 false 반환)
  async function isEmailTaken(email) {
    // 실제 서버에 구현되어 있지 않으므로 항상 false 반환
    return false;
  }

  // 회원가입 (서버에만 저장)
  async function signupUser({ username, name, birth, phone, email, bank, account, password }) {
    username = String(username).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    email = email.toLowerCase();
    password = String(password).trim();
    if (!username) throw new Error('아이디를 입력하세요.');
    if (await isUsernameTaken(username)) throw new Error('이미 존재하는 아이디입니다.');
    if (await isEmailTaken(email)) throw new Error('이미 존재하는 이메일입니다.');
  const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({username, name, birth, phone, email, bank, account, password, status: 'pending', created: new Date().toISOString()})
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.text();
  }

  // 로그인 (서버에서만 검증)
  async function loginId(id, password) {
    if (!id) throw new Error('아이디를 입력하세요.');
    let res;
    try {
  res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: id, password })
      });
    } catch (e) {
      throw new Error('서버 연결에 실패했습니다.');
    }
    if (!res.ok) {
      let msg;
      try { msg = await res.text(); } catch { msg = '로그인 실패'; }
      // 영어 메시지일 때만 한글로 변환, 한글 메시지는 그대로 표시
      if (/^[a-zA-Z\s.,]+$/.test(msg)) {
        if (msg.includes('Not Found') || msg.includes('not found')) msg = '존재하지 않는 아이디입니다.';
        if (msg.includes('Method Not Allowed')) msg = '허용되지 않은 요청입니다.';
        if (msg.includes('Unauthorized') || msg.includes('unauthorized')) msg = '비밀번호가 일치하지 않습니다.';
        if (msg.includes('fail') || msg.includes('error')) msg = '로그인 실패';
      }
      throw new Error(msg || '로그인 실패');
    }
    try {
      const data = await res.json();
      return data;
    } catch {
      throw new Error('서버 응답 오류');
    }
  }

  window.GSApp = { signupUser, loginId, isUsernameTaken };

  // 아이디 입력 제한 및 자동 소문자 변환 (회원가입/로그인)
  function restrictUsernameInput(inputId, msgId) {
    const input = document.getElementById(inputId);
    const msg = msgId ? document.getElementById(msgId) : null;
    if (!input) return;
    input.addEventListener('input', function(e) {
      let val = input.value;
      // 영문(대소문자), 숫자만 허용
      const filtered = val.replace(/[^a-zA-Z0-9]/g, '');
      // 대문자 입력 시 자동 소문자 변환
      if (val !== filtered || /[A-Z]/.test(val)) {
        input.value = filtered.toLowerCase();
        if (msg) {
          msg.textContent = '영문(소문자), 숫자만 입력가능합니다.';
          msg.style.color = '#ff5252';
        }
      } else if (msg) {
        msg.textContent = '';
      }
    });
    input.addEventListener('blur', function() {
      if (msg) msg.textContent = '';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    restrictUsernameInput('username', 'dupMsg'); // 회원가입
    restrictUsernameInput('loginId', 'msg'); // 로그인
  });

// Security and privacy meta (best-effort for static hosting)
try{
  const head=document.head;
  if(!document.querySelector('meta[name="robots"]')){
    const m=document.createElement('meta'); m.name='robots'; m.content='noindex, nofollow, noarchive, nosnippet'; head.appendChild(m);
  }
  if(!document.querySelector('meta[http-equiv="Referrer-Policy"]')){
    const m=document.createElement('meta'); m.setAttribute('http-equiv','Referrer-Policy'); m.setAttribute('content','no-referrer'); head.appendChild(m);
  }
  if(!document.querySelector('meta[http-equiv="Content-Security-Policy"]')){
    const m=document.createElement('meta'); m.setAttribute('http-equiv','Content-Security-Policy'); m.setAttribute('content',"default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"); head.appendChild(m);
  }
}catch(_){ }
// Client-side actions to deter copying/downloading
document.addEventListener('contextmenu', e=> e.preventDefault());
document.addEventListener('dragstart', e=> e.preventDefault());
document.addEventListener('copy', e=> { try{ e.clipboardData?.setData('text/plain',''); }catch(_){} e.preventDefault(); });
document.addEventListener('keydown', e=>{
  const block = (e.ctrlKey||e.metaKey) && ['s','p','u','c'].includes((e.key||'').toLowerCase());
  const dev = e.key==='F12' || (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key));
  if(block||dev) e.preventDefault();
});
document.querySelectorAll('img,video').forEach(el=>{ el.setAttribute('draggable','false'); el.setAttribute('oncontextmenu','return false'); });

// Auto-trigger refresh buttons on page load and when page becomes visible
const triggerRefresh = ()=>{
  // Prefer direct functions if present
  try{
    if(typeof window.renderAll==='function') window.renderAll();
    if(typeof window.renderOrdersAll==='function') window.renderOrdersAll();
    if(typeof window.renderInquiriesAll==='function') window.renderInquiriesAll();
  }catch(_){ }
  // Also click refresh buttons as a fallback
  ['btnUsersRefresh','btnOrdersRefresh','btnInqRefresh'].forEach(id=>{
    const el = document.getElementById(id);
    if(el && typeof el.click === 'function'){
      try{ el.click(); }catch(_){ }
    }
  });
  // Clear any session-based auto-refresh flag
  try{ sessionStorage.removeItem('admin_auto_refresh'); }catch(_){ }
};
// If coming from a tab navigation, honor auto-refresh flag
try{ if(sessionStorage.getItem('admin_auto_refresh')==='1') { triggerRefresh(); } }catch(_){ }
triggerRefresh();
setTimeout(triggerRefresh, 150);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') triggerRefresh(); });
window.addEventListener('pageshow', triggerRefresh);

// 로그인 시 승인대기 회원은 pending.html로 이동
window.GSApp.loginId = async function(id, pw){
  if(!id) throw new Error('아이디를 입력하세요.');
  // 입력값을 소문자/숫자만 허용하고, 앞뒤 공백 제거
  const filtered = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
  const pwTrimmed = String(pw).trim();
  let res;
  try {
  res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: filtered, password: pwTrimmed })
    });
  } catch (e) {
    throw new Error('서버 연결에 실패했습니다.');
  }
  if (!res.ok) {
    let msgText;
    try { msgText = await res.text(); } catch { msgText = '로그인 실패'; }
    // 영어 메시지일 때만 한글로 변환, 한글 메시지는 그대로 표시
    if (/^[a-zA-Z\s.,]+$/.test(msgText)) {
      if (msgText.includes('Not Found') || msgText.includes('not found')) msgText = '존재하지 않는 아이디입니다.';
      if (msgText.includes('Method Not Allowed')) msgText = '허용되지 않은 요청입니다.';
      if (msgText.includes('Unauthorized') || msgText.includes('unauthorized')) msgText = '비밀번호가 일치하지 않습니다.';
      if (msgText.includes('fail') || msgText.includes('error')) msgText = '로그인 실패';
    }
    throw new Error(msgText || '로그인 실패');
  }
  try {
    const data = await res.json();
    return data;
  } catch {
    throw new Error('서버 응답 오류');
  }
}
// ===== 공통 세션 도우미 & 네비 구성 =====
(function(){
  function pickUser(){
    try{ const u = window.GSApp?.currentUser?.(); if (u && (u.username||u.email)) return u; }catch(_){}
    const keys = ['gs_user','gs_user_backup','user','user_session','session_user','admin_session_v1'];
    for(const k of keys){
      try{ const r = localStorage.getItem(k); if (r){ const o=JSON.parse(r); if (o && (o.username||o.email)) return o; } }catch(_){}
    }
    return null;
  }
  function buildUserNav(){
    const area = document.querySelector('#navbar .user-area') || document.getElementById('userArea');
    if (!area) return;
    const u = pickUser();
    if (u){
      area.innerHTML = '<a href="profile.html" class="btn">내정보</a>';
      const np = document.getElementById('navProfileBtn'); if (np) np.style.display='inline-block';
    }else{
      area.innerHTML = '<a href="signup.html" class="btn user-link">회원가입</a> <a href="login.html" class="btn user-link">로그인</a>';
      const np = document.getElementById('navProfileBtn'); if (np) np.style.display='none';
    }
  }
  document.addEventListener('DOMContentLoaded', buildUserNav);
  setInterval(buildUserNav, 1000); // 초기 로드 타이밍 차이 대비 (짧게만 유지)
})();
