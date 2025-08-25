// 보안/설정/관리자 계정 관리 기능 (최대 3개, 비번변경/비활성/삭제)
(function(){
  let admins = window.AdminData ? window.AdminData.admins : [];

  // 기본 관리자 계정(admin/admin) 항상 존재
  function ensureDefaultAdmin() {
    if (!admins.some(a => a.username === 'admin')) {
      admins.unshift({ username:'admin', role:'ADMIN', status:'active', password:'admin', default:true });
    }
  }

  let ipRules = [];

  // 관리자 계정 저장
  async function saveAdmins() {
    try {
      const encrypted = await window.encrypt(admins);
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted })
      });
      if (!res.ok) throw new Error('서버 저장 실패');
    } catch (err) {
      alert('저장 중 오류 발생: ' + err.message);
    }
    if (window.reloadAllData) await window.reloadAllData();
  }

  // 관리자 계정 불러오기
  async function loadAdmins() {
    try {
      const res = await fetch('/api/admin/admins');
      const json = await res.json();
      admins = window.decrypt(json.data) || [];
    } catch {
      admins = [];
    }
    ensureDefaultAdmin();
  }

  // IP 규칙 저장
  async function saveIPRules() {
    try {
      const encrypted = window.encrypt(ipRules);
      await fetch('/api/admin/iprules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted })
      });
    } catch (e) {
      console.error('IP 규칙 저장 오류', e);
    }
  }

  // IP 규칙 불러오기
  async function loadIPRules() {
    try {
      const res = await fetch('/api/admin/iprules');
      const json = await res.json();
      ipRules = window.decrypt(json.data) || [];
    } catch {
      ipRules = [];
    }
    ensureDefaultAdmin();
  }

  // 메인 렌더링
  function render(){
    ensureDefaultAdmin();

    let html = `
      <h3>오늘의 금시세(수동입력 모드)</h3>
      <div style="margin-bottom:16px;">
        <input type="number" id="manualGoldPrice" placeholder="금액 입력(원)" style="width:200px;font-size:18px;" />
        <button class="btn" id="btnSaveGoldPrice">저장</button>
        <span id="manualGoldPriceMode" style="color:#d4af37;font-weight:bold;"></span>
      </div>`;

    // 관리자 계정 관리
    html += `<h3>관리자 계정 관리 <button class="btn" id="btnAddAdmin">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>아이디</th><th>권한</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    admins.forEach((a,i)=>{
      html += `<tr><td>${a.username}</td><td>${a.role}</td><td>${a.status}</td><td>
        <button class="btn small" onclick="editAdmin(${i})">수정</button>
        <button class="btn small" onclick="deleteAdmin(${i})">삭제</button>
        <button class="btn small" onclick="changePwAdmin(${i})">비번변경</button>
      </td></tr>`;
    });
    html += '</tbody></table><div id="adminModal" class="modal" style="display:none;"></div>';

    // IP 접근 관리
    html += `<h3 style="margin-top:32px;">IP 접근 관리 <button class="btn" id="btnAddIP">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>타입</th><th>CIDR</th><th>라벨</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    ipRules.forEach((r,i)=>{
      html += `<tr><td>${r.type}</td><td>${r.cidr}</td><td>${r.label}</td><td>${r.enabled?'활성':'비활성'}</td><td>
        <button class="btn small" onclick="editIP(${i})">수정</button>
        <button class="btn small" onclick="deleteIP(${i})">삭제</button>
      </td></tr>`;
    });
    html += '</tbody></table><div id="ipModal" class="modal" style="display:none;"></div>';

    document.getElementById('view-security').innerHTML = html;

    // 이벤트 바인딩
    document.getElementById('btnAddAdmin').onclick = showAddAdmin;
    document.getElementById('btnAddIP').onclick = showAddIP;

    // 금시세 모드 토글
    const priceInput = document.getElementById('manualGoldPrice');
    const priceMode = document.getElementById('manualGoldPriceMode');
    priceInput.value = localStorage.getItem('manualGoldPrice')||'';
    function updateMode(){
      if(priceInput.value && Number(priceInput.value)>0){
        priceMode.textContent = '수동입력 모드';
        priceMode.style.color = '#d4af37';
      } else {
        priceMode.textContent = '자동 크롤링 모드';
        priceMode.style.color = '#888';
      }
    }
    updateMode();
    document.getElementById('btnSaveGoldPrice').onclick = async function(){
      await fetch('/api/goldprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { manualGoldPrice: priceInput.value } })
      });
      const getRes = await fetch('/api/goldprice');
      const json = await getRes.json();
      localStorage.setItem('manualGoldPrice', json.manualGoldPrice || '');
      updateMode();
      alert('오늘의 금시세가 저장되었습니다.');
    };
    priceInput.oninput = updateMode;
  }

  // ==== Admin 조작 ====
  window.deleteAdmin = function(idx){
    const a = admins[idx];
    if(a && a.username === 'admin') {
      alert('기본 관리자 계정은 삭제할 수 없습니다.');
      return;
    }
    if(confirm('정말 삭제하시겠습니까?')){
      admins.splice(idx,1);
      saveAdmins().then(render);
    }
  };

  window.changePwAdmin = function(idx){
    const a = admins[idx];
    showAdminModal('비밀번호 변경', a, function(data){
      admins[idx].password = data.password;
      saveAdmins().then(render);
    }, true);
  };

  function showAddAdmin(){
    if(admins.length>=3){ alert('최대 3개까지 등록 가능합니다.'); return; }
    showAdminModal('관리자 추가', {}, function(data){
      admins.push({...data, status:'active'});
      saveAdmins().then(render);
    });
  }

  function showAdminModal(title, admin, onSave, pwOnly){
    const modal = document.getElementById('adminModal');
    let html = `<div class="modal-content"><h3>${title}</h3><form id="adminForm">`;
    if(!pwOnly){
      html += `<label>아이디<input name="username" value="${admin.username||''}" required></label>`;
      html += `<label>권한<select name="role"><option value="ADMIN"${admin.role==='ADMIN'?' selected':''}>ADMIN</option><option value="MANAGER"${admin.role==='MANAGER'?' selected':''}>MANAGER</option></select></label>`;
      html += `<label>상태<select name="status"><option value="active"${admin.status==='active'?' selected':''}>활성</option><option value="disabled"${admin.status==='disabled'?' selected':''}>비활성</option></select></label>`;
    }
    html += `<label>비밀번호<input name="password" type="password" value="${admin.password||''}" required></label>`;
    html += `<div style="margin-top:16px;text-align:right;"><button type="submit" class="btn">저장</button> <button type="button" class="btn" id="btnCancel">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    document.getElementById('btnCancel').onclick = ()=>{ modal.style.display='none'; };
    document.getElementById('adminForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }

  // ==== IP 조작 ====
  window.editIP = function(idx){
    const r = ipRules[idx];
    showIPModal('IP 규칙 수정', r, function(data){
      ipRules[idx] = {...r, ...data};
      saveIPRules().then(render);
    });
  };

  window.deleteIP = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      ipRules.splice(idx,1);
      saveIPRules().then(render);
    }
  };

  function showAddIP(){
    showIPModal('IP 규칙 추가', {}, function(data){
      ipRules.push({...data, enabled:true});
      saveIPRules().then(render);
    });
  }

  function showIPModal(title, rule, onSave){
    const modal = document.getElementById('ipModal');
    let html = `<div class="modal-content"><h3>${title}</h3><form id="ipForm">`;
    html += `<label>타입<select name="type"><option value="allow"${rule.type==='allow'?' selected':''}>허용</option><option value="block"${rule.type==='block'?' selected':''}>차단</option></select></label>`;
    html += `<label>CIDR<input name="cidr" value="${rule.cidr||''}" required></label>`;
    html += `<label>라벨<input name="label" value="${rule.label||''}"></label>`;
    html += `<label>상태<select name="enabled"><option value="true"${rule.enabled?' selected':''}>활성</option><option value="false"${!rule.enabled?' selected':''}>비활성</option></select></label>`;
    html += `<div style="margin-top:16px;text-align:right;"><button type="submit" class="btn">저장</button> <button type="button" class="btn" id="btnCancelIP">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    document.getElementById('btnCancelIP').onclick = ()=>{ modal.style.display='none'; };
    document.getElementById('ipForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }

  // 초기 실행
  (async()=>{
    await loadAdmins();
    await loadIPRules();
    render();
  })();
})();
