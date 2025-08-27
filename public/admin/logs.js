// 관리자 접속 로그 관리
(function(){
  let logs = [];
  async function loadLogs() {
    const res = await fetch('/api/logs');
    const json = await res.json();
    logs = Array.isArray(json.data) ? json.data : [];
  }
  async function saveLogs() {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: logs })
    });
  }
  function renderLogs() {
    var html = `<h3>접속 로그</h3>`;
    html += '<table class="admin-table"><thead><tr><th>IP</th><th>횟수</th><th>브라우저</th><th>접속시간</th><th>관리</th></tr></thead><tbody>';
    logs.forEach((log,i)=>{
      html += `<tr>
        <td>${log.ip}</td>
        <td>${log.count}</td>
        <td>${log.ua}</td>
        <td>${log.time}</td>
        <td><button class="dashboard-top-btn small list-btn" onclick="deleteLog(${i})">삭제</button></td>
      </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('view-logs').innerHTML = html;
  }
  window.renderLogs = renderLogs;
  window.deleteLog = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      logs.splice(idx,1);
      saveLogs().then(renderLogs);
    }
  };
  document.addEventListener('DOMContentLoaded', async ()=>{
    await loadLogs();
    renderLogs();
  });
})();
