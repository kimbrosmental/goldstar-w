// 관리자 접속 로그 관리
(function(){
  let logs = [];
  let stats = {
    totalVisits: 0,
    uniqueVisitors: 0,
    currentOnline: 0,
    avgSessionTime: 0
  };

  async function loadLogs() {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const json = await res.json();
        logs = Array.isArray(json.data) ? json.data : [];
        calculateStats();
      } else {
        logs = [];
      }
    } catch (e) {
      console.error('로그 로드 오류:', e);
      logs = [];
    }
  }

  async function saveLogs() {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: logs })
      });
      console.log('로그 저장 완료');
    } catch (e) {
      console.error('로그 저장 오류:', e);
    }
  }

  function calculateStats() {
    stats.totalVisits = logs.length;
    const uniqueIPs = new Set(logs.map(log => log.ip));
    stats.uniqueVisitors = uniqueIPs.size;
    
    // 현재 접속자 (최근 30분 이내)
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    stats.currentOnline = logs.filter(log => 
      log.timestamp && new Date(log.timestamp).getTime() > thirtyMinutesAgo
    ).length;

    // 평균 세션 시간 계산 (세션 시간이 기록된 경우)
    const sessionsWithTime = logs.filter(log => log.sessionTime);
    if (sessionsWithTime.length > 0) {
      const totalTime = sessionsWithTime.reduce((sum, log) => sum + (log.sessionTime || 0), 0);
      stats.avgSessionTime = Math.round(totalTime / sessionsWithTime.length);
    }
  }

  function filterLogsByDate(startDate, endDate) {
    if (!startDate && !endDate) return logs;
    
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000) : Date.now();
    
    return logs.filter(log => {
      if (!log.timestamp) return false;
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start && logTime <= end;
    });
  }

  function generateDummyLogs() {
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    const ips = ['192.168.1.100', '203.104.255.15', '125.209.234.12', '172.16.0.50', '10.0.0.25'];
    const pages = ['index.html', 'profile.html', 'login.html', 'signup.html'];
    
    for (let i = 0; i < 50; i++) {
      const now = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      const logDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
      
      logs.push({
        id: 'LOG' + Date.now() + i,
        ip: ips[Math.floor(Math.random() * ips.length)],
        userAgent: browsers[Math.floor(Math.random() * browsers.length)] + '/' + (Math.floor(Math.random() * 20) + 90),
        timestamp: logDate.toISOString(),
        page: pages[Math.floor(Math.random() * pages.length)],
        sessionTime: Math.floor(Math.random() * 1800) + 60, // 1-30분
        referer: Math.random() > 0.5 ? 'https://google.com' : 'direct',
        country: Math.random() > 0.7 ? 'Korea' : 'Unknown',
        visitCount: Math.floor(Math.random() * 10) + 1,
        screenResolution: Math.random() > 0.5 ? '1920x1080' : '1366x768'
      });
    }
    calculateStats();
  }

  async function reloadAndRender() {
    await loadLogs();
    renderLogs();
  }

  function renderLogs() {
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    
    const filteredLogs = filterLogsByDate(startDate, endDate);
    const dateStats = calculateDateStats(filteredLogs);

    var html = `
      <div style="margin-bottom:20px;">
        <button class="dashboard-top-btn" id="btnRefreshLogs">새로고침</button>
        <button class="dashboard-top-btn" id="btnGenerateDummyLogs" style="margin-left:10px;">샘플 로그 생성</button>
        <button class="dashboard-top-btn" id="btnClearLogs" style="margin-left:10px;background:#f44336;">전체 삭제</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
        <div class="dashboard-card">
          <h3>전체 접속</h3>
          <p>${stats.totalVisits}회</p>
        </div>
        <div class="dashboard-card">
          <h3>순 방문자</h3>
          <p>${stats.uniqueVisitors}명</p>
        </div>
        <div class="dashboard-card">
          <h3>현재 접속</h3>
          <p>${stats.currentOnline}명</p>
        </div>
        <div class="dashboard-card">
          <h3>평균 머문 시간</h3>
          <p>${Math.floor(stats.avgSessionTime / 60)}분 ${stats.avgSessionTime % 60}초</p>
        </div>
      </div>

      <div style="margin-bottom:20px;padding:16px;background:#f5f5f5;border-radius:8px;">
        <h3 style="margin-bottom:16px;">날짜별 필터링</h3>
        <div style="display:flex;gap:10px;align-items:center;">
          <label>시작일: <input type="date" id="startDate" value="${startDate}" style="padding:8px;border:1px solid #ddd;border-radius:4px;"></label>
          <label>종료일: <input type="date" id="endDate" value="${endDate}" style="padding:8px;border:1px solid #ddd;border-radius:4px;"></label>
          <button class="dashboard-top-btn" id="btnFilterLogs">조회</button>
          <button class="dashboard-top-btn" id="btnResetFilter">전체보기</button>
        </div>
        <div style="margin-top:12px;color:#666;">
          필터 결과: ${filteredLogs.length}건 | 
          기간 내 순 방문자: ${dateStats.uniqueVisitors}명 | 
          평균 일일 접속: ${dateStats.avgDaily}회
        </div>
      </div>
    `;

    html += '<h3>접속 로그 목록</h3>';
    html += '<table class="admin-table"><thead><tr><th>IP주소</th><th>브라우저</th><th>접속시간</th><th>페이지</th><th>머문시간</th><th>방문횟수</th><th>국가</th><th>화면해상도</th><th>관리</th></tr></thead><tbody>';
    
    if (filteredLogs.length === 0) {
      html += '<tr><td colspan="9" style="text-align:center;color:#888;">로그가 없습니다.</td></tr>';
    } else {
      filteredLogs.slice(-100).reverse().forEach((log, i) => {
        const sessionTimeStr = log.sessionTime ? 
          `${Math.floor(log.sessionTime / 60)}분 ${log.sessionTime % 60}초` : '알 수 없음';
        
        html += `<tr>
          <td>${log.ip || ''}</td>
          <td>${log.userAgent || ''}</td>
          <td>${log.timestamp ? new Date(log.timestamp).toLocaleString('ko-KR') : ''}</td>
          <td>${log.page || ''}</td>
          <td>${sessionTimeStr}</td>
          <td>${log.visitCount || 1}회</td>
          <td>${log.country || '알 수 없음'}</td>
          <td>${log.screenResolution || '알 수 없음'}</td>
          <td><button class="dashboard-top-btn small list-btn" onclick="deleteLog(${logs.indexOf(log)})">삭제</button></td>
        </tr>`;
      });
    }
    
    html += '</tbody></table>';
    
    document.getElementById('view-logs').innerHTML = html;
    
    // 이벤트 리스너 설정
    document.getElementById('btnRefreshLogs').onclick = reloadAndRender;
    document.getElementById('btnGenerateDummyLogs').onclick = () => {
      generateDummyLogs();
      saveLogs().then(renderLogs);
    };
    document.getElementById('btnClearLogs').onclick = () => {
      if (confirm('모든 로그를 삭제하시겠습니까?')) {
        logs = [];
        saveLogs().then(renderLogs);
      }
    };
    document.getElementById('btnFilterLogs').onclick = renderLogs;
    document.getElementById('btnResetFilter').onclick = () => {
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
      renderLogs();
    };
  }

  function calculateDateStats(filteredLogs) {
    const uniqueIPs = new Set(filteredLogs.map(log => log.ip));
    const dates = new Set(filteredLogs.map(log => 
      log.timestamp ? new Date(log.timestamp).toDateString() : ''
    ).filter(date => date));
    
    const avgDaily = dates.size > 0 ? Math.round(filteredLogs.length / dates.size) : 0;
    
    return {
      uniqueVisitors: uniqueIPs.size,
      avgDaily: avgDaily
    };
  }

  window.renderLogs = renderLogs;
  window.deleteLog = function(idx) {
    if (confirm('정말 삭제하시겠습니까?')) {
      logs.splice(idx, 1);
      saveLogs().then(reloadAndRender);
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await loadLogs();
    renderLogs();
  });
})();
