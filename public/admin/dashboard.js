// 관리자 대시보드 SPA 라우팅 및 메뉴 처리
(function(){
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    users: document.getElementById('view-users'),
    orders: document.getElementById('view-orders'),
    inquiries: document.getElementById('view-inquiries'),
    security: document.getElementById('view-security')
  };
  function showView(view){
    Object.values(views).forEach(v=>v.style.display='none');
    if(views[view]) {
      views[view].style.display='block';
      // 각 영역 진입 시 렌더 함수 자동 실행
      if(view==='dashboard' && typeof window.renderDashboard==='function') window.renderDashboard();
      if(view==='users' && typeof window.renderUsers==='function') window.renderUsers();
      if(view==='orders' && typeof window.renderOrders==='function') window.renderOrders();
      if(view==='inquiries' && typeof window.renderInquiries==='function') window.renderInquiries();
      if(view==='security' && typeof window.renderSecurity==='function') window.renderSecurity();
    }
  }
  document.querySelectorAll('.admin-sidebar nav a').forEach(a=>{
    a.addEventListener('click',function(e){
      e.preventDefault();
      const hash = a.getAttribute('href').replace('#','');
      showView(hash);
    });
  });
  // 기본: 대시보드
  showView('dashboard');
  window.renderDashboard = function() {
    const el = document.getElementById('view-dashboard');
    el.innerHTML = `
      <h2>관리자 대시보드</h2>
      <div class="dashboard-widgets">
        <div class="widget">회원 수: <span id="userCount">-</span></div>
        <div class="widget">주문 수: <span id="orderCount">-</span></div>
        <div class="widget">문의 수: <span id="inquiryCount">-</span></div>
      </div>
    `;
    // 실제 데이터는 AJAX 등으로 불러와서 채워넣기
    document.getElementById('userCount').textContent = '123';
    document.getElementById('orderCount').textContent = '45';
    document.getElementById('inquiryCount').textContent = '7';
  };
})();
