// 관리자 대시보드 (회원, 주문, 문의 현황 표시)
(async function () {
  const corsHeaders = { 'Content-Type': 'application/json' };

  async function fetchJSON(url) {
    try {
      const res = await fetch(url, { headers: corsHeaders });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("API 호출 실패:", url, e);
      return [];
    }
  }

  let users = [];
  let orders = [];
  let inquiries = [];

  async function loadData() {
    users = await fetchJSON('/api/users');
    orders = await fetchJSON('/api/orders');
    inquiries = await fetchJSON('/api/inquiries');
  }

  function renderDashboard() {
    const el = document.getElementById('view-dashboard');
    if (!el) return;

    const totalUsers = Array.isArray(users) ? users.length : 0;
    const pendingUsers = Array.isArray(users) ? users.filter(u => u.status === 'pending').length : 0;
    const totalOrders = Array.isArray(orders) ? orders.length : 0;
    const totalInquiries = Array.isArray(inquiries) ? inquiries.length : 0;

    let html = `
      <div style="font-size:1.2em;font-weight:bold;margin-bottom:18px;">
        전체 회원수: ${totalUsers}명
      </div>
      <div style="font-size:1em;margin-bottom:12px;">
        주문 수: ${totalOrders}건 | 문의 수: ${totalInquiries}건
      </div>
    `;

    if (pendingUsers > 0) {
      html += `
        <div style="background:#FFD70022;color:#b5942b;padding:18px 24px;
          border-radius:12px;margin-bottom:24px;font-size:1.15em;font-weight:bold;
          cursor:pointer;" onclick="window.gotoPendingUser()">
          회원가입 요청 ${pendingUsers}건 - 클릭하여 승인
        </div>
      `;
    }

    el.innerHTML = html;
  }

  // 첫 렌더 시 무조건 실행되도록 수정 (API 실패해도 기본 UI 보이게)
  document.addEventListener('DOMContentLoaded', async () => {
    await loadData().catch(() => {});  // 실패해도 무시
    renderDashboard();
  });

  // 탭 이동 시 다시 렌더
  window.addEventListener('pageshow', renderDashboard);

  // 외부에서 새로고침 요청 가능하도록
  window.renderDashboard = async function () {
    await loadData().catch(() => {});
    renderDashboard();
  };

  // 회원가입 요청 알림 클릭 → 대기 회원 목록으로 이동
  window.gotoPendingUser = function () {
    const tab = document.getElementById('nav-users');
    if (tab) tab.click();
    setTimeout(() => {
      const rows = document.querySelectorAll('#view-users tbody tr');
      for (const row of rows) {
        if (row.innerHTML.includes('대기')) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 300);
  };
})();
