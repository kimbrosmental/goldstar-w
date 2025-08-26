// 관리자 대시보드 SPA 라우팅 및 메뉴 처리

(function(){
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    users: document.getElementById('view-users'),
    orders: document.getElementById('view-orders'),
    inquiries: document.getElementById('view-inquiries'),
    security: document.getElementById('view-security')
  };

  // 통합 데이터 상태
  window.AdminData = {
    users: [],
    orders: [],
    inquiries: [],
    admins: []
  };

  // 통합 리로드 함수
  async function reloadAllData() {
    // 회원
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      window.AdminData.users = typeof window.decrypt === 'function' ? await window.decrypt(json.data) : json.data;
    } catch { window.AdminData.users = []; }
    // 주문
    try {
      const res = await fetch('/api/admin/orders');
      const json = await res.json();
      window.AdminData.orders = typeof window.decrypt === 'function' ? await window.decrypt(json.data) : json.data;
    } catch { window.AdminData.orders = []; }
    // 문의
    try {
      const res = await fetch('/api/admin/inquiries');
      const json = await res.json();
      window.AdminData.inquiries = typeof window.decrypt === 'function' ? await window.decrypt(json.data) : json.data;
    } catch { window.AdminData.inquiries = []; }
    // 관리자
    try {
      const res = await fetch('/api/admin/admins');
      const json = await res.json();
      window.AdminData.admins = typeof window.decrypt === 'function' ? await window.decrypt(json.data) : json.data;
    } catch { window.AdminData.admins = []; }
    // 대시보드 렌더링
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    // 각 영역 렌더링
    if (typeof window.renderUsers === 'function') window.renderUsers();
    if (typeof window.renderOrders === 'function') window.renderOrders();
    if (typeof window.renderInquiries === 'function') window.renderInquiries();
    if (typeof window.renderSecurity === 'function') window.renderSecurity();
  }

  window.reloadAllData = reloadAllData;

  function showView(view){
    Object.values(views).forEach(v=>v.style.display='none');
    if(views[view]) views[view].style.display='block';
    // 뷰 전환 시 데이터 리로드
    reloadAllData();
  }
  document.querySelectorAll('.admin-sidebar nav a').forEach(a=>{
    a.addEventListener('click',function(e){
      e.preventDefault();
      const hash = a.getAttribute('href').replace('#','');
      showView(hash);
    });
  });
  // 최초 진입 시 전체 데이터 로드 및 대시보드 표시
  reloadAllData();
  showView('dashboard');
  window.renderDashboard = renderDashboard;
})();
