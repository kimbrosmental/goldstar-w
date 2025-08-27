// 관리자 대시보드 SPA 라우팅 및 메뉴 처리
(function(){
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    users: document.getElementById('view-users'),
    orders: document.getElementById('view-orders'),
    inquiries: document.getElementById('view-inquiries'),
    security: document.getElementById('view-security'),
    logs: document.getElementById('view-logs')
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
      if(view==='logs' && typeof window.renderLogs==='function') window.renderLogs();
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
  // 대시보드 진입 시점에 대시보드 렌더링 보장
  if (typeof window.renderDashboard === 'function') {
    window.renderDashboard();
  } else {
    // Chart.js 로드 후에도 렌더링이 안될 경우 재시도
    setTimeout(function(){
      if (typeof window.renderDashboard === 'function') window.renderDashboard();
    }, 500);
  }
})();
