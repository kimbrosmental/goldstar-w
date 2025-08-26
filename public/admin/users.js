// 회원 관리 기능 (목록/검색/상세/승인/반려/삭제/비번변경/엑셀)
(function(){
  let users = [];

  // Cloudflare Worker API로 회원 목록 조회
  async function fetchUsersFromAPI(){
    const res = await fetch('/api/users', { method: 'GET' });
    if(res.status === 200){
      return await res.json();
    } else {
      return [];
    }
  }

  // 회원 목록 불러오기
  async function loadKVUsers(){
    const res = await fetchUsersFromAPI();
    if (Array.isArray(res)) {
      users = res;
    } else {
      users = [];
    }
  }

  // 목록 새로고침
  async function reloadAndRender(){
    await loadKVUsers();
    render();
  }

  document.addEventListener('DOMContentLoaded', reloadAndRender);

  function render(){
    var html = `<button class="dashboard-top-btn" id="btnAddUser">회원 추가</button>`;
    html += '<table class="admin-table"><thead><tr><th>아이디</th><th>이름</th><th>생년월일</th><th>연락처</th><th>이메일</th><th>은행</th><th>계좌번호</th><th>상태</th><th>생성일</th><th>수정일</th><th>관리</th></tr></thead><tbody>';
    users.forEach((u,i)=>{
      html += `<tr><td>${u.username}</td><td>${u.name||''}</td><td>${u.birth||''}</td><td>${u.phone||''}</td><td>${u.email||''}</td><td>${u.bank||''}</td><td>${u.account||''}</td><td>${u.status||''}</td><td>${u.created||''}</td><td>${u.updated||''}</td><td>
        <button class="dashboard-top-btn" style="padding:8px 18px;font-size:1em;" onclick="editUser(${i})">수정</button>
        <button class="dashboard-top-btn" style="padding:8px 18px;font-size:1em;" onclick="deleteUser(${i})">삭제</button>
        <button class="dashboard-top-btn" style="padding:8px 18px;font-size:1em;" onclick="changePwUser(${i})">비번변경</button>
        ${u.status==='pending'?`<button class="dashboard-top-btn" style="background:#FFD700;color:#222;" onclick="approveUser(${i})">승인</button>`:''}
      </td></tr>`;
    });
    html += '</tbody></table>';
    html += `<div id="userModal" class="modal" style="display:none;"></div>`;
    document.getElementById('view-users').innerHTML = html;
    document.getElementById('btnAddUser').onclick = showAddUser;
  }

  // 회원 수정
  window.editUser = function(idx){
    const u = users[idx];
    showUserModal('회원 정보 수정', u, function(data){
      (async()=>{
        const updated = { ...u, ...data };
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        await reloadAndRender();
      })();
    });
  };

  // 회원 삭제
  window.deleteUser = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      (async()=>{
        await fetch('/api/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: users[idx].username })
        });
        await reloadAndRender();
      })();
    }
  };

  // 비밀번호 변경
  window.changePwUser = function(idx){
    const u = users[idx];
    showUserModal('비밀번호 변경', u, function(data){
      (async()=>{
        const updated = { ...u, password: data.password };
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        await reloadAndRender();
      })();
    }, true);
  };

  // 회원 추가
  function showAddUser(){
    showUserModal('회원 추가', {}, function(data){
      (async()=>{
        const newUser = {
          ...data,
          created: new Date().toISOString(),
          status: 'active'
        };
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
        await reloadAndRender();
      })();
    });
  }

  // 모달창
  function showUserModal(title, user, onSave, pwOnly){
    const modal = document.getElementById('userModal');
    let html = `<div class="modal-content" style="background:linear-gradient(135deg,#fffbe6 80%,#f7e7b4 100%);padding:48px 48px 36px 48px;min-width:900px;max-width:1100px;">`;
    html += `<h3 style="color:#b5942b;font-size:1.25em;margin-bottom:22px;font-weight:bold;">${title}</h3><form id="userForm">`;
    if(!pwOnly){
      html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px 32px;padding:12px 0 8px 0;align-items:start;">`;
      html += `<label>아이디<input name="username" value="${user.username||''}" required></label>`;
      html += `<label>이름<input name="name" value="${user.name||''}" required></label>`;
      html += `<label>생년월일<input name="birth" value="${user.birth||''}" required></label>`;
      html += `<label>연락처<input name="phone" value="${user.phone||''}" required></label>`;
      html += `<label>이메일<input name="email" value="${user.email||''}" required></label>`;
      html += `<label>은행<input name="bank" value="${user.bank||''}" required></label>`;
      html += `<label>계좌번호<input name="account" value="${user.account||''}" required></label>`;
      html += `<label>상태<select name="status"><option value="active"${user.status==='active'?' selected':''}>활성</option><option value="pending"${user.status==='pending'?' selected':''}>대기</option><option value="rejected"${user.status==='rejected'?' selected':''}>거절</option></select></label>`;
      html += `</div>`;
      html += `<label>비밀번호<input name="password" type="password" value="${user.password||''}" required></label>`;
    } else {
      html += `<label>비밀번호<input name="password" type="password" required></label>`;
    }
    html += `<div style="margin-top:24px;text-align:center;"><button type="submit">저장</button> <button type="button" id="btnCancel">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    document.getElementById('btnCancel').onclick = ()=>{ modal.style.display='none'; };
    document.getElementById('userForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }

  // 회원 승인
  window.approveUser = function(idx){
    (async()=>{
      const updated = { ...users[idx], status: 'active' };
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      await reloadAndRender();
    })();
  };

  // 대시보드 알림
  function renderDashboardAlert(){
    const dashboard = document.getElementById('view-dashboard');
    const pendingUsers = users.filter(u=>u.status==='pending');
    dashboard.innerHTML = `<div style="font-size:1.2em;font-weight:bold;margin-bottom:18px;">전체 회원수: ${users.length}명</div>`;
    if(pendingUsers.length){
      dashboard.innerHTML += `<div style="background:#FFD70022;color:#b5942b;padding:18px 24px;border-radius:12px;margin-bottom:24px;font-size:1.15em;font-weight:bold;cursor:pointer;" onclick="window.gotoPendingUser()">회원가입 요청 ${pendingUsers.length}건 - 클릭하여 승인</div>`;
    }
  }

  window.gotoPendingUser = function(){
    document.getElementById('nav-users').click();
    setTimeout(()=>{
      const rows = document.querySelectorAll('#view-users tbody tr');
      for(const row of rows){
        if(row.innerHTML.includes('대기')){ row.scrollIntoView({behavior:'smooth',block:'center'}); break; }
      }
    },300);
  };

  document.addEventListener('DOMContentLoaded', renderDashboardAlert);
})();
