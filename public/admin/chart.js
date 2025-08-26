// Chart.js CDN 로드 및 대시보드 그래프 렌더링
(function(){
  function initCharts() {
    if (!window.Chart) return; // Chart.js 로드 실패시 중단
    if (!window.ChartDataLabels) {
      const dlabelScript = document.createElement('script');
      dlabelScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels';
      dlabelScript.onload = drawAllCharts;
      document.head.appendChild(dlabelScript);
    } else {
      drawAllCharts();
    }
  }

  // 전역 접근 가능하도록 보장
  window.renderDashboardCharts = initCharts;

  function drawAllCharts() {
    const stats = {
      totalUsers: 0,
      newUsers: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalInquiries: 0,
      unansweredInquiries: 0
    };

    const today = new Date();
    const dateStr = today.toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });

    const topHtml = `
      <div class="dashboard-date-row">
        <span class="dashboard-date-big">${dateStr}</span>
      </div>
      <div class="dashboard-top-bar2">
        <div class="dashboard-top-left2">
          <button class="dashboard-top-btn" id="btnTodayStats">오늘 현황</button>
          <span class="dashboard-top-label">날짜별 통계</span>
          <input type="date" id="statDateStart" class="dashboard-date-select" value="${today.toISOString().slice(0,10)}" />
          <span class="dashboard-top-label">~</span>
          <input type="date" id="statDateEnd" class="dashboard-date-select" value="${today.toISOString().slice(0,10)}" />
          <button class="dashboard-top-btn" id="btnDateStats">조회</button>
        </div>
        <div class="dashboard-top-right2">
          <button class="dashboard-home-btn" id="btnHome">홈</button>
          <button class="dashboard-logout-btn" id="btnLogout">로그아웃</button>
        </div>
      </div>
    `;

    const view = document.getElementById('view-dashboard');
    if(view) view.innerHTML = topHtml;

    document.getElementById('btnHome').onclick = () => window.location.href='../index.html';
    document.getElementById('btnLogout').onclick = () => {
      localStorage.removeItem('admin_session_v1');
      window.location.href='../index.html';
    };
  }

  // DOM 로드시 자동 실행
  document.addEventListener("DOMContentLoaded", () => {
    if(!window.Chart){
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = initCharts;
      document.head.appendChild(script);
    } else {
      initCharts();
    }
  });
})();
