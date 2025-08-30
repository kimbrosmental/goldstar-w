// 보안/설정/관리자 계정 관리 기능 (금시세/관리자/아이피 규칙)
(function(){
  window.admins = [];
  let ipRules = [];
  let bankInfo = {};
  let goldPrice = '';

  // -----------------------------
  // 데이터 로드/저장 함수들
  async function loadGoldPrice() {
    try {
      const res = await fetch('/api/security?type=goldprice');
      if (res.ok) {
        const data = await res.json();
        goldPrice = data.manualGoldPrice || '';
      }
    } catch (e) {
      console.error('금시세 로드 오류:', e);
    }
  }

  async function saveGoldPrice(price) {
    try {
      await fetch('/api/security?type=goldprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualGoldPrice: price })
      });
      document.getElementById('manualGoldPriceMode').textContent = '저장됨';
      setTimeout(() => {
        document.getElementById('manualGoldPriceMode').textContent = '';
      }, 2000);
      console.log('금시세 저장 완료');
    } catch (e) {
      console.error('금시세 저장 오류:', e);
    }
  }

  async function loadBankInfo() {
    try {
      const res = await fetch('/api/security?type=depositbank');
      if (res.ok) {
        const data = await res.json();
        bankInfo = data || {};
        
        // UI에 반영
        if (document.getElementById('bankName')) {
          document.getElementById('bankName').value = bankInfo.bankName || '';
          document.getElementById('accountNumber').value = bankInfo.accountNumber || '';
          document.getElementById('accountHolder').value = bankInfo.accountHolder || '';
        }
      }
    } catch (e) {
      console.error('은행정보 로드 오류:', e);
    }
  }

  async function saveBankInfo() {
    const bankName = document.getElementById('bankName').value.trim();
    const accountNumber = document.getElementById('accountNumber').value.trim();
    const accountHolder = document.getElementById('accountHolder').value.trim();
    
    if (!bankName || !accountNumber || !accountHolder) {
      alert('모든 은행 정보를 입력해주세요.');
      return;
    }

    bankInfo = { bankName, accountNumber, accountHolder };
    
    try {
      await fetch('/api/security?type=depositbank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankInfo)
      });
      document.getElementById('bankInfoStatus').textContent = '저장 완료';
      setTimeout(() => {
        document.getElementById('bankInfoStatus').textContent = '';
      }, 2000);
    } catch (e) {
      console.error('은행정보 저장 오류:', e);
      alert('은행 정보 저장 중 오류가 발생했습니다.');
    }
  }

  async function loadAdmins() {
    try {
      const res = await fetch('/api/security?type=admin');
      if (res.ok) {
        const data = await res.json();
        if (data.admins) {
          window.admins = Array.isArray(data.admins) ? data.admins : [];
        }
      }
    } catch (e) {
      console.error('관리자 로드 오류:', e);
    }
    ensureDefaultAdmin();
  }

  async function saveAdmins() {
    try {
      await fetch('/api/security?type=admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admins: window.admins })
      });
      console.log('관리자 저장 완료');
    } catch (e) {
      console.error('관리자 저장 오류:', e);
    }
  }

  async function loadIPRules() {
    try {
      const res = await fetch('/api/security?type=iprules');
      if (res.ok) {
        const data = await res.json();
        ipRules = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error('IP규칙 로드 오류:', e);
    }
  }

  async function saveIPRules() {
    try {
      await fetch('/api/security?type=iprules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: ipRules })
      });
      console.log('IP규칙 저장 완료');
    } catch (e) {
      console.error('IP규칙 저장 오류:', e);
    }
  }

  // -----------------------------
  // 기본 관리자 계정 항상 보장
  function ensureDefaultAdmin() {
    if (!window.admins.some(a => a.username === 'admin')) {
      window.admins.unshift({
        username: 'admin',
        passwordHash: 'admin123',
        role: 'super',
        status: 'active',
        created: new Date().toISOString()
      });
    }
  }

  // -----------------------------
  // 데이터 로드 및 새로고침
  async function reloadAndRender() {
    await Promise.all([
      loadGoldPrice(),
      loadBankInfo(),
      loadAdmins(),
      loadIPRules()
    ]);
    render();
  }

  // -----------------------------
  // 렌더링
  function render(){
    ensureDefaultAdmin();

    var html = `<div style="margin-bottom:16px;">
      <button class="dashboard-top-btn" id="btnRefreshSecurity" style="margin-bottom:20px;">새로고침</button>
    </div>`;

    html += `<h3>오늘의 금시세(수동입력 모드)</h3>
      <div style='margin-bottom:32px;'>
        <input type='number' id='manualGoldPrice' placeholder='금액 입력(원)' value='${goldPrice}' style='width:200px;font-size:18px;padding:10px;border:1px solid #d4af37;border-radius:6px;' />
        <button class='btn' id='btnSaveGoldPrice' style='margin-left:10px;'>저장</button>
        <span id='manualGoldPriceMode' style='color:#d4af37;font-weight:bold;margin-left:10px;'></span>
      </div>`;

    html += `<h3>입금 계좌 정보 설정</h3>
      <div style='margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;'>
        <input type='text' id='bankName' placeholder='은행명' value='${bankInfo.bankName||''}' style='padding:10px;font-size:14px;border:1px solid #d4af37;border-radius:6px;' />
        <input type='text' id='accountNumber' placeholder='계좌번호' value='${bankInfo.accountNumber||''}' style='padding:10px;font-size:14px;border:1px solid #d4af37;border-radius:6px;' />
        <input type='text' id='accountHolder' placeholder='예금주명' value='${bankInfo.accountHolder||''}' style='padding:10px;font-size:14px;border:1px solid #d4af37;border-radius:6px;' />
      </div>
      <div style='margin-bottom:32px;'>
        <button class='btn' id='btnSaveBankInfo'>은행 정보 저장</button>
        <span id='bankInfoStatus' style='color:#d4af37;font-weight:bold;margin-left:10px;'></span>
      </div>`;

    html += `<h3>관리자 계정 관리 <button class="btn" id="btnAddAdmin">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>아이디</th><th>권한</th><th>상태</th><th>생성일</th><th>관리</th></tr></thead><tbody>';
    window.admins.forEach((a,i)=>{
      html += `<tr>
        <td>${a.username}</td>
        <td>${a.role}</td>
        <td>${a.status}</td>
        <td>${a.created ? new Date(a.created).toLocaleDateString('ko-KR') : ''}</td>
        <td>
          <button class="btn small" onclick="editAdmin(${i})">수정</button>
          <button class="btn small" onclick="deleteAdmin(${i})">삭제</button>
          <button class="btn small" onclick="changePwAdmin(${i})">비번변경</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table><div id="adminModal" class="modal" style="display:none;"></div>';

    html += `<h3 style="margin-top:32px;">IP 접근 관리 <button class="btn" id="btnAddIP">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>타입</th><th>CIDR</th><th>라벨</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    ipRules.forEach((r,i)=>{
      html += `<tr>
        <td>${r.type}</td>
        <td>${r.cidr}</td>
        <td>${r.label}</td>
        <td>${r.status}</td>
        <td>
          <button class="btn small" onclick="editIP(${i})">수정</button>
          <button class="btn small" onclick="deleteIP(${i})">삭제</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table><div id="ipModal" class="modal" style="display:none;"></div>';

    document.getElementById('view-security').innerHTML = html;
    
    // 이벤트 리스너 설정
    document.getElementById('btnRefreshSecurity').onclick = reloadAndRender;
    document.getElementById('btnAddAdmin').onclick = showAddAdmin;
    document.getElementById('btnAddIP').onclick = showAddIP;
    document.getElementById('btnSaveGoldPrice').onclick = ()=> saveGoldPrice(document.getElementById('manualGoldPrice').value);
    document.getElementById('btnSaveBankInfo').onclick = saveBankInfo;
    
    // 은행 정보 표시
    loadBankInfo();
  }

  // -----------------------------
  // 관리자 관리 함수들
  window.editAdmin = function(idx){
    const a = window.admins[idx];
    showAdminModal('관리자 수정', a, function(data){
      window.admins[idx] = {...a, ...data};
      saveAdmins().then(reloadAndRender);
    });
  };

  window.deleteAdmin = function(idx){
    if(window.admins[idx].username === 'admin') {
      alert('기본 관리자 계정은 삭제할 수 없습니다.');
      return;
    }
    if(confirm('정말 삭제하시겠습니까?')){
      window.admins.splice(idx,1);
      saveAdmins().then(reloadAndRender);
    }
  };

  window.changePwAdmin = function(idx){
    const a = window.admins[idx];
    showAdminModal('비밀번호 변경', a, function(data){
      window.admins[idx].passwordHash = data.passwordHash;
      saveAdmins().then(reloadAndRender);
    }, true);
  };

  function showAddAdmin(){
    showAdminModal('관리자 추가', {}, function(data){
      window.admins.push({...data, created: new Date().toISOString()});
      saveAdmins().then(reloadAndRender);
    });
  }

  function showAdminModal(title, admin, onSave, pwOnly){
    const modal = document.getElementById('adminModal');
    let html = `<div class="modal-content"><h3>${title}</h3><form id="adminForm">`;
    if(!pwOnly){
      html += `<label>아이디<input name="username" value="${admin.username||''}" required></label>`;
      html += `<label>권한<select name="role">
        <option value="admin"${admin.role==='admin'?' selected':''}>관리자</option>
        <option value="super"${admin.role==='super'?' selected':''}>최고관리자</option>
      </select></label>`;
      html += `<label>상태<select name="status">
        <option value="active"${admin.status==='active'?' selected':''}>활성</option>
        <option value="inactive"${admin.status==='inactive'?' selected':''}>비활성</option>
      </select></label>`;
    }
    html += `<label>비밀번호<input name="passwordHash" type="password" required></label>`;
    html += `<div style="margin-top:16px;text-align:right;"><button type="submit" class="btn">저장</button> <button type="button" class="btn" id="btnCancelAdmin">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    
    document.getElementById('btnCancelAdmin').onclick = ()=>{ modal.style.display='none'; };
    document.getElementById('adminForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }

  // -----------------------------
  // IP 규칙 관리 함수들
  window.editIP = function(idx){
    const r = ipRules[idx];
    showIPModal('IP 규칙 수정', r, function(data){
      ipRules[idx] = {...r, ...data};
      saveIPRules().then(reloadAndRender);
    });
  };

  window.deleteIP = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      ipRules.splice(idx,1);
      saveIPRules().then(reloadAndRender);
    }
  };

  function showAddIP(){
    showIPModal('IP 규칙 추가', {}, function(data){
      ipRules.push(data);
      saveIPRules().then(reloadAndRender);
    });
  }

  function showIPModal(title, rule, onSave){
    const modal = document.getElementById('ipModal');
    let html = `<div class="modal-content"><h3>${title}</h3><form id="ipForm">`;
    html += `<label>타입<select name="type">
      <option value="allow"${rule.type==='allow'?' selected':''}>허용</option>
      <option value="deny"${rule.type==='deny'?' selected':''}>차단</option>
    </select></label>`;
    html += `<label>CIDR<input name="cidr" value="${rule.cidr||''}" placeholder="예: 192.168.1.0/24" required></label>`;
    html += `<label>라벨<input name="label" value="${rule.label||''}" placeholder="설명"></label>`;
    html += `<label>상태<select name="status">
      <option value="active"${rule.status==='active'?' selected':''}>활성</option>
      <option value="inactive"${rule.status==='inactive'?' selected':''}>비활성</option>
    </select></label>`;
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

  // -----------------------------
  // 전역 렌더 함수 노출
  window.renderSecurity = reloadAndRender;

  // 초기 로드
  document.addEventListener('DOMContentLoaded', reloadAndRender);
})();
