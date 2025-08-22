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
    if(views[view]) views[view].style.display='block';
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
})();
