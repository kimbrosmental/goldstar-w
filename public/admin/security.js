// 보안/설정/관리자 계정 관리 기능 (최대 3개, 비번변경/비활성/삭제)
(function(){
  // 샘플 관리자 계정 데이터 (실제 구현시 암호화/DB 연동)
  window.admins = [];
  // 기본 관리자 계정(admin/admin) 항상 존재
  function ensureDefaultAdmin() {
    if (!admins.some(a => a.username === 'admin')) {
      admins.unshift({ username:'admin', role:'ADMIN', status:'active', password:'admin', default:true });
    }
  }
  let ipRules = [];
  // 암호화 저장/불러오기 함수
  async function saveAdmins() {
    try {
      const encrypted = await window.encrypt(window.admins);
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted })
      });
      if (!res.ok) throw new Error('서버 저장 실패');
    } catch (err) {
      alert('저장 중 오류 발생: ' + err.message);
    }
  }
  async function loadAdmins() {
  try {
    const res = await fetch('/api/admins');
    const json = await res.json();
    // 데이터 구조 방어적 처리
    if (json && json.data) {
      try {
        window.admins = window.decrypt(json.data);
      } catch (e) {
        window.admins = [];
      }
    } else if (Array.isArray(json)) {
      window.admins = json;
    } else {
      window.admins = [];
    }
  } catch (e) {
    window.admins = [];
  }
  ensureDefaultAdmin();
  }
  async function saveIPRules() {
    const res = await fetch('/api/iprules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: window.encrypt(ipRules) })
    });
  }
  async function loadIPRules() {
    try {
      const res = await fetch('/api/iprules');
      const json = await res.json();
      if (json && json.data) {
        try {
          ipRules = window.decrypt(json.data);
        } catch (e) {
          ipRules = [];
        }
      } else if (Array.isArray(json)) {
        ipRules = json;
      } else {
        ipRules = [];
      }
    } catch (e) {
      ipRules = [];
    }
  }
  function render(){
  ensureDefaultAdmin();
  var html = `<h3>오늘의 금시세(수동입력 모드)</h3><div style='margin-bottom:16px;'><input type='number' id='manualGoldPrice' placeholder='금액 입력(원)' style='width:200px;font-size:18px;' /> <button class='btn' id='btnSaveGoldPrice'>저장</button> <span id='manualGoldPriceMode' style='color:#d4af37;font-weight:bold;'></span></div>`;
  html += `<h3>관리자 계정 관리 <button class=\"btn\" id=\"btnAddAdmin\">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>아이디</th><th>권한</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    admins.forEach((a,i)=>{
      html += `<tr><td>${a.username}</td><td>${a.role}</td><td>${a.status}</td><td>
        <button class=\"btn small list-btn\" style=\"background:#d4af37;color:#fff;\" onclick=\"editAdmin(${i})\">수정</button>
        <button class=\"btn small list-btn\" style=\"background:#d4af37;color:#fff;\" onclick=\"deleteAdmin(${i})\">삭제</button>
        <button class=\"btn small list-btn\" style=\"background:#d4af37;color:#fff;\" onclick=\"changePwAdmin(${i})\">비번변경</button>
      </td></tr>`;
    });
    html += '</tbody></table>';
    html += `<div id="adminModal" class="modal" style="display:none;"></div>`;

    html += `<h3 style=\"margin-top:32px;\">IP 접근 관리 <button class=\"btn\" id=\"btnAddIP\">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>타입</th><th>CIDR</th><th>라벨</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    ipRules.forEach((r,i)=>{
      html += `<tr><td>${r.type}</td><td>${r.cidr}</td><td>${r.label}</td><td>${r.enabled?'활성':'비활성'}</td><td>
        <button class=\"btn small list-btn\" style=\"background:#d4af37;color:#fff;\" onclick=\"editIP(${i})\">수정</button>
        <button class=\"btn small list-btn\" style=\"background:#d4af37;color:#fff;\" onclick=\"deleteIP(${i})\">삭제</button>
      </td></tr>`;
    });
    html += '</tbody></table>';
    html += `<div id="ipModal" class="modal" style="display:none;"></div>`;

    document.getElementById('view-security').innerHTML = html;
    document.getElementById('btnAddAdmin').onclick = showAddAdmin;
    document.getElementById('btnAddIP').onclick = showAddIP;
    // 금시세 수동입력 모드
    const priceInput = document.getElementById('manualGoldPrice');
    const priceMode = document.getElementById('manualGoldPriceMode');
    priceInput.value = localStorage.getItem('manualGoldPrice')||'';
    function updateMode(){
      if(priceInput.value && Number(priceInput.value)>0){
        priceMode.textContent = '수동입력 모드';
        priceMode.style.color = '#d4af37';
      }else{
        priceMode.textContent = '자동 크롤링 모드';
        priceMode.style.color = '#888';
      }
    }
    updateMode();
    document.getElementById('btnSaveGoldPrice').onclick = function(){
      (async()=>{
  // 서버에 저장 (KV)
  const res = await fetch('/api/goldprice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { manualGoldPrice: priceInput.value } })
        });
        // 저장 후 즉시 서버에서 최신값 불러와서 반영
  const getRes = await fetch('/api/goldprice');
        const json = await getRes.json();
        localStorage.setItem('manualGoldPrice', json.manualGoldPrice || '');
        updateMode();
        alert('오늘의 금시세가 저장되었습니다.');
      })();
    };
    priceInput.oninput = updateMode;
  }

  window.editAdmin = function(idx){
    const a = admins[idx];
    showAdminModal('관리자 정보 수정', a, function(data){
      (async()=>{ admins[idx] = {...a, ...data}; await saveAdmins(); render(); })();
    });
  };
  window.deleteAdmin = function(idx){
    const a = admins[idx];
    if(a && a.username === 'admin') {
      alert('기본 관리자 계정은 삭제할 수 없습니다.');
      return;
    }
    if(confirm('정말 삭제하시겠습니까?')){
      (async()=>{ admins.splice(idx,1); await saveAdmins(); render(); })();
    }
  };
  window.changePwAdmin = function(idx){
    const a = admins[idx];
    showAdminModal('비밀번호 변경', a, function(data){
      (async()=>{ admins[idx].password = data.password; await saveAdmins(); render(); })();
    }, true);
  };
  function showAddAdmin(){
    if(admins.length>=3){ alert('최대 3개까지 등록 가능합니다.'); return; }
    showAdminModal('관리자 추가', {}, function(data){
      (async()=>{ admins.push({...data, status:'active'}); await saveAdmins(); render(); })();
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

  window.editIP = function(idx){
    const r = ipRules[idx];
    showIPModal('IP 규칙 수정', r, function(data){
      (async()=>{ ipRules[idx] = {...r, ...data}; await saveIPRules(); render(); })();
    });
  };
  window.deleteIP = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      (async()=>{ ipRules.splice(idx,1); await saveIPRules(); render(); })();
    }
  };
  function showAddIP(){
    showIPModal('IP 규칙 추가', {}, function(data){
      (async()=>{ ipRules.push({...data, enabled:true}); await saveIPRules(); render(); })();
    });
  }
  function showIPModal(title, rule, onSave){
    const modal = document.getElementById('ipModal');
    let html = `<div class="modal-content"><h3>${title}</h3><form id="ipForm">`;
    html += `<label>타입<select name="type"><option value="allow"${rule.type==='allow'?' selected':''}>허용</option><option value="block"${rule.type==='block'?' selected':''}>차단</option></select></label>`;
    html += `<label>CIDR<input name="cidr" value="${rule.cidr||''}" required></label>`;
    html += `<label>라벨<input name="label" value="${rule.label||''}"></label>`;
    html += `<label>상태<select name="enabled"><option value="true"${rule.enabled?' selected':''}>활성</option><option value="false"${!rule.enabled?' selected':''}>비활성</option></select></label>`;
    html += `<div style="margin-top:16px;text-align:right;"><button type="submit" class="btn">저장</button> <button type="button" class="btn" id="btnCancel">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    document.getElementById('btnCancel').onclick = ()=>{ modal.style.display='none'; };
    document.getElementById('ipForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      data.enabled = data.enabled==='true';
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }
  document.addEventListener('DOMContentLoaded', async ()=>{
    await loadAdmins();
    await loadIPRules();
    render();
  });
})();
