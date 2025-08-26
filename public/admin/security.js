// 보안/설정/관리자 계정 관리 기능 (금시세/관리자/아이피 규칙)
(function(){
  window.admins = [];
  let ipRules = [];

  // -----------------------------
  // 기본 관리자 계정 항상 보장
  function ensureDefaultAdmin() {
    if (!admins.some(a => a.username === 'admin')) {
      admins.unshift({ username:'admin', role:'ADMIN', status:'active', password:'admin', default:true });
    }
  }

  // -----------------------------
  // 관리자 계정 저장/로드
  async function saveAdmins() {
    try {
      const encrypted = await window.encrypt(window.admins);
      const adminid = window.admins.length > 0 ? JSON.stringify(window.admins[0]) : '';
      const res = await fetch('/api/security?type=admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encrypted, adminid })
      });
      if (!res.ok) throw new Error('서버 저장 실패');
    } catch (err) {
      alert('관리자 저장 오류: ' + err.message);
    }
  }

  async function loadAdmins() {
    try {
      const res = await fetch('/api/security?type=admin');
      const json = await res.json();
      if (json && json.data) {
        try { window.admins = window.decrypt(json.data); }
        catch { window.admins = []; }
      } else if (Array.isArray(json)) {
        window.admins = json;
      } else {
        window.admins = [];
      }
      if (json && json.adminid) {
        try { window.adminid = JSON.parse(json.adminid); }
        catch { window.adminid = null; }
      }
    } catch {
      window.admins = [];
      window.adminid = null;
    }
    ensureDefaultAdmin();
  }

  // -----------------------------
  // IP 규칙 저장/로드
  async function saveIPRules() {
    try {
      const res = await fetch('/api/security?type=iprules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: ipRules })
      });
      if (!res.ok) throw new Error('IP 규칙 저장 실패');
    } catch (err) {
      alert('IP 규칙 저장 오류: ' + err.message);
    }
  }

  async function loadIPRules() {
    try {
      const res = await fetch('/api/security?type=iprules');
      const json = await res.json();
      if (Array.isArray(json)) {
        ipRules = json;
      } else {
        ipRules = [];
      }
    } catch {
      ipRules = [];
    }
  }

  // -----------------------------
  // 금시세 수동 입력 저장
  async function saveGoldPrice(price) {
    try {
      await fetch('/api/security?type=goldprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualGoldPrice: price })
      });
      localStorage.setItem('manualGoldPrice', price);
      alert('오늘의 금시세가 저장되었습니다.');
    } catch (e) {
      alert('금시세 저장 실패');
    }
  }

  // -----------------------------
  // 렌더링
  function render(){
    ensureDefaultAdmin();

    var html = `<h3>오늘의 금시세(수동입력 모드)</h3>
      <div style='margin-bottom:16px;'>
        <input type='number' id='manualGoldPrice' placeholder='금액 입력(원)' style='width:200px;font-size:18px;' />
        <button class='btn' id='btnSaveGoldPrice'>저장</button>
        <span id='manualGoldPriceMode' style='color:#d4af37;font-weight:bold;'></span>
      </div>`;

    html += `<h3>관리자 계정 관리 <button class="btn" id="btnAddAdmin">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>아이디</th><th>권한</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    admins.forEach((a,i)=>{
      html += `<tr><td>${a.username}</td><td>${a.role}</td><td>${a.status}</td><td>
        <button class="btn small list-btn" onclick="editAdmin(${i})">수정</button>
        <button class="btn small list-btn" onclick="deleteAdmin(${i})">삭제</button>
        <button class="btn small list-btn" onclick="changePwAdmin(${i})">비번변경</button>
      </td></tr>`;
    });
    html += '</tbody></table><div id="adminModal" class="modal" style="display:none;"></div>';

    html += `<h3 style="margin-top:32px;">IP 접근 관리 <button class="btn" id="btnAddIP">추가</button></h3>`;
    html += '<table class="admin-table"><thead><tr><th>타입</th><th>CIDR</th><th>라벨</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    ipRules.forEach((r,i)=>{
      html += `<tr><td>${r.type}</td><td>${r.cidr}</td><td>${r.label}</td><td>${r.enabled?'활성':'비활성'}</td><td>
        <button class="btn small list-btn" onclick="editIP(${i})">수정</button>
        <button class="btn small list-btn" onclick="deleteIP(${i})">삭제</button>
      </td></tr>`;
    });
    html += '</tbody></table><div id="ipModal" class="modal" style="display:none;"></div>';

    document.getElementById('view-security').innerHTML = html;
    document.getElementById('btnAddAdmin').onclick = showAddAdmin;
    document.getElementById('btnAddIP').onclick = showAddIP;

    // 금시세
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
    document.getElementById('btnSaveGoldPrice').onclick = ()=> saveGoldPrice(priceInput.value);
    priceInput.oninput = updateMode;
  }

  // -----------------------------
  // 이벤트 핸들러 (관리자/아이피 추가/수정/삭제) → 그대로 유지
  // (코드 길이 관계로 생략했지만 기존 window.editAdmin, window.deleteAdmin,
  //  window.changePwAdmin, showAddAdmin, showAdminModal, editIP, deleteIP, showAddIP, showIPModal 모두 그대로 두면 됩니다.)

  // -----------------------------
  // 초기 로드
  document.addEventListener('DOMContentLoaded', async ()=>{
    await loadAdmins();
    await loadIPRules();
    render();
  });
})();
