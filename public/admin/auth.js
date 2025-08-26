// 관리자 인증/권한/세션 관리 모듈
(function(){
  // 관리자/유저 통합 인증
  // 개발자 모드 활성화 (아래 줄을 주석 해제하면 콘솔 디버깅 가능)
  window.DEBUG = true;
  const SESSION_KEY = 'admin_session_v1';
  function bcryptHash(pw){ return pw; /* 실제 구현시 bcrypt 적용 */ }
  function bcryptCheck(pw, hash){ return pw===hash; /* 실제 구현시 bcrypt 적용 */ }

  // SECURITY에서 관리자 계정 가져오기
  async function getAdminsFromSecurity() {
    const res = await fetch('/api/security');
    if (res.ok) {
      const json = await res.json();
      let admins = [];
      try {
        if (window.decrypt && json.admins) {
          admins = await window.decrypt(json.admins);
        }
      } catch (e) {
        if (window.DEBUG) console.error('관리자 복호화 오류:', e);
        throw new Error('관리자 데이터 복호화 실패');
      }
      if (window.DEBUG) console.log('관리자 계정:', admins);
      return Array.isArray(admins) ? admins : [];
    }
    return [];
  }

  // USERS에서 유저 계정 가져오기
  async function getUsersFromKV() {
    const res = await fetch('/api/users');
    if (res.ok) {
      const json = await res.json();
      let users = [];
      try {
        // 암호화된 유저 데이터(문자열) 또는 평문 배열 모두 지원
        if (window.decrypt && Array.isArray(json.data) && typeof json.data[0] === 'string') {
          // 암호화된 유저 배열
          for (const enc of json.data) {
            try {
              const arr = await window.decrypt(enc);
              if (Array.isArray(arr)) users = users.concat(arr);
            } catch (e) {
              // 복호화 실패시 무시
            }
          }
        } else if (Array.isArray(json.data)) {
          // 평문 유저 배열
          users = json.data;
        }
      } catch (e) {
        if (window.DEBUG) console.error('유저 복호화 오류:', e);
        throw new Error('회원 데이터 복호화 실패');
      }
      if (window.DEBUG) console.log('유저 계정:', users);
      return Array.isArray(users) ? users : [];
    }
    return [];
  }

  // 통합 로그인 함수
  async function login(username, pw) {
    // 관리자 먼저 확인
    let admins = [];
    try {
      admins = await getAdminsFromSecurity();
    } catch (e) {
      throw new Error('관리자 데이터 복호화 실패');
    }
    if (window.DEBUG) console.log('로그인 시도(관리자):', admins);
    const admin = admins.find(a => a.username === username && a.status === 'active');
    if (admin) {
      if (!bcryptCheck(pw, admin.passwordHash)) throw new Error('비밀번호 오류');
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: admin.username, role: admin.role, ts: Date.now() }));
      if (window.DEBUG) console.log('관리자 로그인 성공:', admin);
      return { role: 'admin' };
    }
    // 유저 확인 (API에서 status와 msg를 반환하도록 변경)
    let result;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw })
      });
      result = await res.json();
    } catch (e) {
      throw new Error('회원 데이터 복호화 실패');
    }
    if (window.DEBUG) console.log('로그인 시도(유저):', result);
    if (!result.ok) throw new Error(result.msg || '로그인 실패');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: result.username, role: 'user', status: result.status, ts: Date.now() }));
    // 상태별 처리: pending이면 반드시 pending.html로 이동하도록 명시적으로 반환
    if (result.status === 'pending') {
      return { role: 'user', status: 'pending', msg: result.msg || '회원가입 승인 대기중입니다.', redirect: '../pending.html?msg=' + encodeURIComponent(result.msg || '회원가입 승인 대기중입니다.') };
    }
    if (result.status === 'rejected') {
      return { role: 'user', status: 'rejected', msg: result.msg || '회원가입 거절입니다. 관리자에게 문의하세요!', redirect: '../pending.html?msg=' + encodeURIComponent(result.msg || '회원가입 거절입니다. 관리자에게 문의하세요!') };
    }
    if (result.status === 'active') {
      return { role: 'user', status: 'active', msg: result.msg, redirect: '../profile.html' };
    }
    // 기타 상태
    return { role: 'user', status: result.status, msg: result.msg, redirect: null };
  }

  function logout() { localStorage.removeItem(SESSION_KEY); }
  function currentSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  window.AdminAuth = { login, logout, currentSession };
})();
