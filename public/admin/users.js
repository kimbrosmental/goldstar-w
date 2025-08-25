// 회원 관리 기능 (목록/검색/상세/승인/반려/삭제/비번변경/엑셀)
(function(){
  let users = window.AdminData ? window.AdminData.users : [];
  async function saveUsers() {
    const encrypted = await window.encrypt(users);
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted })
    });
    if (window.reloadAllData) await window.reloadAllData();
  }
  async function reloadAndRender(){
    if (window.reloadAllData) await window.reloadAllData();
    renderUsers();
  }
  function renderUsers(){
    var html = `<button class="dashboard-top-btn" id="btnAddUser">회원 추가</button>`;
    html += '<table class="admin-table"><thead><tr><th>아이디</th><th>비밀번호</th><th>이름</th><th>생년월일</th><th>연락처</th><th>이메일</th><th>은행</th><th>계좌번호</th><th>상태</th><th>생성일</th><th>관리</th></tr></thead><tbody>';
    users = window.AdminData ? window.AdminData.users : [];
    users.forEach((u,i)=>{
      html += `<tr><td>${u.username}</td><td>●●●●</td><td>${u.name}</td><td>${u.birth}</td><td>${u.phone}</td><td>${u.email}</td><td>${u.bank}</td><td>${u.account}</td><td>${u.status}</td><td>${u.created}</td><td>
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
    window.renderUsers = renderUsers;
    document.addEventListener('DOMContentLoaded', reloadAndRender);
  }
  window.editUser = function(idx){
    const u = users[idx];
    showUserModal('회원 정보 수정', u, function(data){
      (async()=>{ users[idx] = {...u, ...data}; await saveUsers(); })();
    });
  };
  window.deleteUser = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      (async()=>{ users.splice(idx,1); await saveUsers(); })();
    }
  };
  window.changePwUser = function(idx){
    const u = users[idx];
    showUserModal('비밀번호 변경', u, function(data){
      (async()=>{ users[idx].password = data.password; await saveUsers(); })();
    }, true);
  };
  function showAddUser(){
    showUserModal('회원 추가', {}, function(data){
      (async()=>{ users.push({...data, id:Date.now(), created:new Date().toISOString(), status:'active', orders:0}); await saveUsers(); })();
    });
  }
  function showUserModal(title, user, onSave, pwOnly){
    const modal = document.getElementById('userModal');
    let html = `<div class="modal-content" style="background:linear-gradient(135deg,#fffbe6 80%,#f7e7b4 100%);padding:48px 48px 36px 48px;min-width:900px;max-width:1100px;">`;
    html += `<h3 style="color:#b5942b;font-size:1.25em;margin-bottom:22px;font-weight:bold;">${title}</h3><form id="userForm">`;
    if(!pwOnly){
      html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px 32px;padding:12px 0 8px 0;align-items:start;">`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">아이디<input name="username" value="${user.username||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">이름<input name="name" value="${user.name||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">생년월일<input name="birth" value="${user.birth||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">연락처<input name="phone" value="${user.phone||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">이메일<input name="email" value="${user.email||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">은행<input name="bank" value="${user.bank||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">계좌번호<input name="account" value="${user.account||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;margin-bottom:0;display:flex;flex-direction:column;align-items:flex-start;">상태<select name="status" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;"><option value="active"${user.status==='active'?' selected':''}>활성</option><option value="pending"${user.status==='pending'?' selected':''}>대기</option></select></label>`;
      html += `</div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 32px;margin-top:18px;">`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">비밀번호<input name="password" type="password" value="${user.password||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">비밀번호 확인<input name="password_confirm" type="password" value="${user.password||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `</div>`;
    }
    html += `<div style="margin-top:24px;text-align:center;display:flex;gap:18px;justify-content:center;"><button type="submit" class="dashboard-top-btn" style="min-width:120px;">저장</button> <button type="button" class="dashboard-top-btn" id="btnCancel" style="min-width:120px;background:#b5942b;">취소</button></div>`;
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
  window.approveUser = function(idx){
    users[idx].status = 'active';
    saveUsers();
  };
  function renderDashboardAlert(){
    const dashboard = document.getElementById('view-dashboard');
    const usersData = window.AdminData ? window.AdminData.users : users;
    const pendingUsers = usersData.filter(u=>u.status==='pending');
    dashboard.innerHTML = `<div style="font-size:1.2em;font-weight:bold;margin-bottom:18px;">전체 회원수: ${usersData.length}명</div>`;
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
  document.addEventListener('DOMContentLoaded', reloadAndRender);
  document.addEventListener('DOMContentLoaded', renderDashboardAlert);
})();