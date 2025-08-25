// Chart.js CDN 로드 및 대시보드 그래프 렌더링
(function(){
  if(!window.Chart){
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = renderDashboardCharts;
    document.head.appendChild(script);
  } else {
    renderDashboardCharts();
  }

  function renderDashboard(){
    // ChartDataLabels 플러그인 로드
    if (!window.ChartDataLabels) {
      var dlabelScript = document.createElement('script');
      dlabelScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels';
      dlabelScript.onload = drawAllCharts;
      document.head.appendChild(dlabelScript);
    } else {
      drawAllCharts();
    }

    function drawAllCharts() {
      // AdminData에서 최신값 반영
      var stats = {
        totalUsers: window.AdminData?.users?.length || 0,
        newUsers: window.AdminData?.users?.filter(u=>{
          const today = new Date();
          const created = new Date(u.created);
          return created.toDateString() === today.toDateString();
        }).length || 0,
        totalOrders: window.AdminData?.orders?.length || 0,
        pendingOrders: window.AdminData?.orders?.filter(o=>o.status==='결제대기'||o.status==='pending').length || 0,
        totalInquiries: window.AdminData?.inquiries?.length || 0,
        unansweredInquiries: window.AdminData?.inquiries?.filter(q=>q.status==='미답변'||q.status==='미답변').length || 0
      };
    // 상단 버튼/날짜/로그아웃/홈
    var today = new Date();
    var dateStr = today.toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
    var topHtml = `
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
    // 카드 영역
    var cardHtml = `
      <div class="dashboard-card-row" style="display:flex;gap:28px;margin-bottom:0;flex-wrap:wrap;">
        <div class="dashboard-card"><h3>총 회원수</h3><p>${stats.totalUsers}명</p></div>
        <div class="dashboard-card" style="margin-right:38px;"><h3>오늘 신규가입</h3><p>${stats.newUsers}명</p></div>
        <div class="dashboard-card"><h3>총 주문</h3><p>${stats.totalOrders}건</p></div>
        <div class="dashboard-card" style="margin-right:38px;"><h3>미처리 주문</h3><p>${stats.pendingOrders}건</p></div>
        <div class="dashboard-card"><h3>총 문의</h3><p>${stats.totalInquiries}건</p></div>
        <div class="dashboard-card"><h3>미답변 문의</h3><p>${stats.unansweredInquiries}건</p></div>
      </div>
      <div style="height:32px;"></div>
      <div class="dashboard-card-row" style="display:flex;gap:32px;margin-bottom:18px;flex-wrap:wrap;">
        <div class="dashboard-card"><h3>총 금액</h3><p>₩ 0</p></div>
        <div class="dashboard-card"><h3>총 돈수</h3><p>0돈</p></div>
        <div class="dashboard-card"><h3>총 kg</h3><p>0kg</p></div>
      </div>
      <div class="dashboard-card-row" style="display:flex;gap:32px;margin-bottom:18px;flex-wrap:wrap;">
        <div class="dashboard-card"><h3>입금 금액</h3><p>0원</p></div>
        <div class="dashboard-card"><h3>입금 건수</h3><p>0건</p></div>
        <div class="dashboard-card"><h3>미입금 금액</h3><p>0원</p></div>
        <div class="dashboard-card"><h3>미입금 건수</h3><p>0건</p></div>
      </div>
      <div class="dashboard-graphs" style="display:flex;flex-wrap:wrap;gap:24px;justify-content:flex-start;">
        <div style="flex:1 1 220px;min-width:220px;max-width:260px;margin-bottom:32px;">
          <canvas id="chartMembers" width="220" height="120"></canvas>
        </div>
        <div style="flex:1 1 220px;min-width:220px;max-width:260px;margin-bottom:32px;">
          <canvas id="chartOrders" width="220" height="120"></canvas>
        </div>
        <div style="flex:1 1 220px;min-width:220px;max-width:260px;margin-bottom:32px;">
          <canvas id="chartInquiries" width="220" height="120"></canvas>
        </div>
        <div style="flex:1 1 220px;min-width:220px;max-width:260px;margin-bottom:32px;">
          <canvas id="chartMoney" width="220" height="120"></canvas>
        </div>
        <div style="flex:1 1 220px;min-width:220px;max-width:260px;margin-bottom:32px;">
          <canvas id="chartCounts" width="220" height="120"></canvas>
        </div>
      </div>
    `;
    var view = document.getElementById('view-dashboard');
    if(view) view.innerHTML = topHtml + cardHtml;
    // 버튼 이벤트
    document.getElementById('btnHome').onclick = function(){ window.location.href='../index.html'; };
  document.getElementById('btnLogout').onclick = function(){ localStorage.removeItem('admin_session_v1'); window.location.href='../index.html'; };
    document.getElementById('btnTodayStats').onclick = function(){
      // 오늘 날짜 기준 통계만 표시
      alert('오늘의 통계\n신규 가입: '+stats.newUsers+'명\n미처리 주문: '+stats.pendingOrders+'건\n미답변 문의: '+stats.unansweredInquiries+'건\n총 금액: ₩ 52,000,000\n총 돈수: 4,800돈\n입금 현황: 48,000,000원\n입금 확인 건수: 312건');
    };
    document.getElementById('btnDateStats').onclick = function(){
      var start = document.getElementById('statDateStart').value;
      var end = document.getElementById('statDateEnd').value;
      // 샘플: 실제 통계 연동 필요
      alert(start+' ~ '+end+' 통계\n신규 가입: '+stats.newUsers+'명\n미처리 주문: '+stats.pendingOrders+'건\n미답변 문의: '+stats.unansweredInquiries+'건\n총 금액: ₩ 52,000,000\n총 돈수: 4,800돈\n입금 현황: 48,000,000원\n입금 확인 건수: 312건');
    };
    // 그래프
      // 회원 그래프 아래 숫자 표시
      var memberLabels = ['총회원수', '오늘신규가입'];
      var memberData = [stats.totalUsers, stats.newUsers];
  // ...숫자 표시 제거...
      new Chart(document.getElementById('chartMembers').getContext('2d'), {
        type: 'bar',
        data: {
          labels: memberLabels,
          datasets: [{
            label: '회원',
            data: memberData,
            backgroundColor: ['#FFD700','#b5942b']
          }]
        },
        options: {
          responsive:true,
          plugins:{legend:{display:false}},
          scales:{y:{beginAtZero:true}}
        }
      });

      // 주문 그래프 아래 숫자 표시
      var orderLabels = ['총주문', '미처리주문'];
      var orderData = [stats.totalOrders, stats.pendingOrders];
  // ...숫자 표시 제거...
      new Chart(document.getElementById('chartOrders').getContext('2d'), {
        type: 'bar',
        data: {
          labels: orderLabels,
          datasets: [{
            label: '주문',
            data: orderData,
            backgroundColor: ['#003D33','#b5942b']
          }]
        },
        options: {
          responsive:true,
          plugins:{legend:{display:false}},
          scales:{y:{beginAtZero:true}}
        }
      });

      // 문의 그래프 아래 숫자 표시
      var inquiryLabels = ['총문의', '미답변문의'];
      var inquiryData = [stats.totalInquiries, stats.unansweredInquiries];
  // ...숫자 표시 제거...
      new Chart(document.getElementById('chartInquiries').getContext('2d'), {
        type: 'bar',
        data: {
          labels: inquiryLabels,
          datasets: [{
            label: '문의',
            data: inquiryData,
            backgroundColor: ['#FFD700','#003D33']
          }]
        },
        options: {
          responsive:true,
          plugins:{legend:{display:false}},
          scales:{y:{beginAtZero:true}}
        }
      });

      // 금액 그래프 아래 숫자 표시
      var moneyLabels = ['총금액', '입금금액', '미입금금액'];
  var moneyData = [0, 0, 0];
  // ...숫자 표시 제거...
      new Chart(document.getElementById('chartMoney').getContext('2d'), {
        type: 'bar',
        data: {
          labels: moneyLabels,
          datasets: [{
            label: '금액',
            data: moneyData,
            backgroundColor: ['#FFD700','#b5942b','#003D33']
          }]
        },
        options: {
          responsive:true,
          plugins:{legend:{display:false}},
          scales:{y:{beginAtZero:true}}
        }
      });

      // 건수 그래프 아래 숫자 표시
      var countLabels = ['입금건수', '미입금건수'];
  var countData = [0, 0];
  // ...숫자 표시 제거...
      new Chart(document.getElementById('chartCounts').getContext('2d'), {
        type: 'bar',
        data: {
          labels: countLabels,
          datasets: [{
            label: '건수',
            data: countData,
            backgroundColor: ['#FFD700','#b5942b']
          }]
        },
        options: {
          responsive:true,
          plugins:{legend:{display:false}},
          scales:{y:{beginAtZero:true}}
        }
      });
    }
  }
})();
