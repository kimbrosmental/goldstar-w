// public/admin/dashboard.js
(async function () {
  let users = [], orders = [], inquiries = [];

  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }

  async function loadData() {
    users = await fetchJSON("/api/users");
    orders = await fetchJSON("/api/orders");
    inquiries = await fetchJSON("/api/inquiries");
  }

  function renderDashboard() {
    const dashboard = document.getElementById("view-dashboard");
    if (!dashboard) return;

    const pendingUsers = users.filter((u) => u.status === "pending");
    dashboard.innerHTML = `
      <div style="font-size:1.2em;font-weight:bold;margin-bottom:18px;">
        전체 회원수: ${users.length}명
      </div>
      <div>총 주문수: ${orders.length}건</div>
      <div>1:1 문의: ${inquiries.length}건</div>
    `;

    if (pendingUsers.length) {
      dashboard.innerHTML += `
        <div style="background:#FFD70022;color:#b5942b;padding:18px 24px;border-radius:12px;
                    margin-top:12px;font-size:1.15em;font-weight:bold;cursor:pointer;"
             onclick="window.gotoPendingUser()">
          회원가입 요청 ${pendingUsers.length}건 - 클릭하여 승인
        </div>
      `;
    }
  }

  // 최초 실행
  document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    renderDashboard();
  });

  // 새로고침 버튼 등 추가 필요시
  window.refreshDashboard = async function () {
    await loadData();
    renderDashboard();
  };
})();
