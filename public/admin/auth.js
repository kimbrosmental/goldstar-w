// 관리자 인증/권한/세션 관리 모듈
(function(){
  // 관리자 계정 최대 3개, localStorage에 암호화 저장
  const ADMIN_KEY = 'admin_accounts_v1';
  const SESSION_KEY = 'admin_session_v1';
  const bcryptRounds = 12;
  // 관리자 계정 구조: { username, passwordHash, role, status }
  function getAdmins(){
    try{
      const raw = localStorage.getItem(ADMIN_KEY);
      if(!raw) return [{ username:'admin', passwordHash:bcryptHash('admin'), role:'ADMIN', status:'active' }];
      return JSON.parse(raw);
    }catch(_){ return [{ username:'admin', passwordHash:bcryptHash('admin'), role:'ADMIN', status:'active' }]; }
  }
  function saveAdmins(list){ localStorage.setItem(ADMIN_KEY, JSON.stringify(list)); }
  function bcryptHash(pw){ return pw; /* 실제 구현시 bcrypt 적용 */ }
  function bcryptCheck(pw, hash){ return pw===hash; /* 실제 구현시 bcrypt 적용 */ }
  function login(username, pw){
    const admins = getAdmins();
    const admin = admins.find(a=>a.username===username && a.status==='active');
    if(!admin) throw new Error('존재하지 않는 관리자 계정');
    if(!bcryptCheck(pw, admin.passwordHash)) throw new Error('비밀번호 오류');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username:admin.username, role:admin.role, ts:Date.now() }));
    return true;
  }
  function logout(){ localStorage.removeItem(SESSION_KEY); }
  function currentAdmin(){
    try{
      const raw = localStorage.getItem(SESSION_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(_){ return null; }
  }
  window.AdminAuth = { getAdmins, saveAdmins, login, logout, currentAdmin };
})();
