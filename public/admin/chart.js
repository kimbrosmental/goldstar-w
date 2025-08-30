// Chart.js CDN 로드 및 대시보드 그래프 렌더링
(function(){
  window.renderDashboard = async function renderDashboardCharts(){
    try {
      // 실제 데이터 로드
      let stats = {
        totalUsers: 0,
        newUsers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalInquiries: 0,
        unansweredInquiries: 0
      };

      try {
        // 회원 데이터 로드
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const users = await usersRes.json();
          stats.totalUsers = users.length;
          const today = new Date();
          stats.newUsers = users.filter(u => {
            if (!u.created) return false;
            const created = new Date(u.created);
            return created.toDateString() === today.toDateString();
          }).length;
        }

        // 주문 데이터 로드
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          stats.totalOrders = Array.isArray(orders) ? orders.length : 0;
          stats.pendingOrders = Array.isArray(orders) ? orders.filter(o => o.status === '주문 승인 대기').length : 0;
        }

        // 문의 데이터 로드
        const inquiriesRes = await fetch('/api/inquiries');
        if (inquiriesRes.ok) {
          const inquiries = await inquiriesRes.json();
          stats.totalInquiries = Array.isArray(inquiries) ? inquiries.length : 0;
          stats.unansweredInquiries = Array.isArray(inquiries) ? inquiries.filter(i => i.status === '미답변').length : 0;
        }
      } catch (e) {
        console.error('대시보드 데이터 로드 오류:', e);
      }

      // 상단 버튼/날짜/로그아웃/홈
      var today = new Date();
      var dateStr = today.toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
      
      var html = `
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
            <button class="dashboard-home-btn" id="btnHome" onclick="window.location.href='../index.html'">홈</button>
            <button class="dashboard-logout-btn" id="btnLogout" onclick="AdminAuth.logout(); window.location.href='login.html'">로그아웃</button>
          </div>
        </div>`;

      html += `<div class="chart-labels-row">
        <div class="chart-label-item"><span class="chart-label-title">전체 회원</span><span class="chart-label-value" id="statTotalUsers">${stats.totalUsers}</span></div>
        <div class="chart-label-item"><span class="chart-label-title">신규 회원</span><span class="chart-label-value" id="statNewUsers">${stats.newUsers}</span></div>
        <div class="chart-label-item"><span class="chart-label-title">전체 주문</span><span class="chart-label-value" id="statTotalOrders">${stats.totalOrders}</span></div>
        <div class="chart-label-item"><span class="chart-label-title">미처리 주문</span><span class="chart-label-value" id="statPendingOrders">${stats.pendingOrders}</span></div>
        <div class="chart-label-item"><span class="chart-label-title">전체 문의</span><span class="chart-label-value" id="statTotalInquiries">${stats.totalInquiries}</span></div>
        <div class="chart-label-item"><span class="chart-label-title">미답변 문의</span><span class="chart-label-value" id="statUnansweredInquiries">${stats.unansweredInquiries}</span></div>
      </div>`;

      document.getElementById('view-dashboard').innerHTML = html;

      // 이벤트 리스너 추가
      document.getElementById('btnTodayStats').onclick = () => window.renderDashboard();
      document.getElementById('btnDateStats').onclick = () => {
        alert('날짜별 통계 조회 기능');
      };

    } catch (e) {
      console.error('대시보드 렌더링 오류:', e);
      document.getElementById('view-dashboard').innerHTML = '<div style="padding:20px;color:red;">대시보드 로드 중 오류가 발생했습니다.</div>';
    }
  };
})();
