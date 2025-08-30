// 1:1 문의 관리 기능 (목록/상세/답변)
(function(){
  let inquiries = [];
  
  async function loadInquiries() {
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        inquiries = Array.isArray(data) ? data : [];
        console.log('문의 데이터 로드:', inquiries);
      } else {
        inquiries = [];
      }
    } catch (e) {
      console.error('문의 로드 오류:', e);
      inquiries = [];
    }
  }
  
  async function saveInquiries() {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: inquiries })
      });
      console.log('문의 데이터 저장 완료');
    } catch (e) {
      console.error('문의 저장 오류:', e);
    }
  }

  async function reloadAndRender() {
    await loadInquiries();
    render();
  }
  function render(){
    var html = `<div style="margin-bottom:16px;">
      <button class="dashboard-top-btn" id="btnAddInquiry">문의 추가</button>
      <button class="dashboard-top-btn" id="btnRefreshInquiries" style="margin-left:10px;">새로고침</button>
    </div>`;
    
    html += '<table class="admin-table"><thead><tr><th>문의ID</th><th>회원</th><th>제목</th><th>내용</th><th>생성일</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    
    if (inquiries.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;color:#888;">문의가 없습니다.</td></tr>';
    } else {
      inquiries.forEach((q,i)=>{
        const content = (q.content || '').length > 30 ? (q.content || '').substring(0, 30) + '...' : (q.content || '');
        html += `<tr>
          <td>${q.id || 'INQ'+(i+1)}</td>
          <td>${q.user || q.username || ''}</td>
          <td>${q.title || '1:1 문의'}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${content}</td>
          <td>${q.date ? new Date(q.date).toLocaleDateString('ko-KR') : ''}</td>
          <td><span style="padding:2px 6px;border-radius:4px;background:${getStatusColor(q.status)};color:#fff;font-size:12px;">${q.status || '미답변'}</span></td>
          <td style="white-space:nowrap;">
            <button class="dashboard-top-btn small list-btn" onclick="editInquiry(${i})" style="margin:1px;">상세/답변</button>
            <button class="dashboard-top-btn small list-btn" onclick="deleteInquiry(${i})" style="margin:1px;">삭제</button>
            <button class="dashboard-top-btn small list-btn" onclick="changeStatusInquiry(${i})" style="margin:1px;">상태변경</button>
          </td>
        </tr>`;
      });
    }
    
    html += '</tbody></table>';
    html += `<div id="inquiryModal" class="modal" style="display:none;"></div>`;
    document.getElementById('view-inquiries').innerHTML = html;
    
    document.getElementById('btnAddInquiry').onclick = showAddInquiry;
    document.getElementById('btnRefreshInquiries').onclick = reloadAndRender;
  }

  function getStatusColor(status) {
    switch(status) {
      case '미답변': return '#ff9800';
      case '답변완료': return '#4caf50';
      case '보류': return '#9e9e9e';
      default: return '#666';
    }
  }

  window.editInquiry = function(idx){
    const q = inquiries[idx];
    showInquiryModal('문의 상세/답변', q, function(data){
      inquiries[idx] = {...q, ...data, status: data.answer ? '답변완료' : (data.status || '미답변')};
      saveInquiries().then(reloadAndRender);
    });
  };
  
  window.deleteInquiry = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      inquiries.splice(idx,1);
      saveInquiries().then(reloadAndRender);
    }
  };
  
  window.changeStatusInquiry = function(idx){
    const q = inquiries[idx];
    showInquiryModal('문의 상태 변경', q, function(data){
      inquiries[idx].status = data.status;
      saveInquiries().then(reloadAndRender);
    }, true);
  };
  
  function showAddInquiry(){
    showInquiryModal('문의 추가', {}, function(data){
      const newInquiry = {...data, id:'INQ'+Date.now(), date:new Date().toISOString(), status:'미답변'};
      inquiries.push(newInquiry);
      saveInquiries().then(reloadAndRender);
    });
  }
  
  function showInquiryModal(title, inquiry, onSave, statusOnly){
    const modal = document.getElementById('inquiryModal');
    let html = `<div class="modal-content" style="background:linear-gradient(135deg,#fffbe6 80%,#f7e7b4 100%);padding:48px 48px 36px 48px;min-width:700px;max-width:900px;">`;
    html += `<h3 style="color:#b5942b;font-size:1.25em;margin-bottom:22px;font-weight:bold;">${title}</h3><form id="inquiryForm">`;
    
    if(!statusOnly){
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 32px;padding:12px 0 8px 0;align-items:start;">`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">회원<input name="user" value="${inquiry.user||inquiry.username||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">제목<input name="title" value="${inquiry.title||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `</div>`;
      html += `<div style="margin-top:20px;">`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:block;margin-bottom:10px;">내용<textarea name="content" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;min-height:120px;">${inquiry.content||''}</textarea></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:block;">답변<textarea name="answer" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;min-height:120px;" placeholder="관리자 답변을 입력하세요...">${inquiry.answer||''}</textarea></label>`;
      html += `</div>`;
    }
    
    html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:inline-block;margin-top:20px;margin-right:20px;">상태<select name="status" style="width:120px;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;">
      <option value="미답변"${inquiry.status==='미답변'?' selected':''}>미답변</option>
      <option value="답변완료"${inquiry.status==='답변완료'?' selected':''}>답변완료</option>
      <option value="보류"${inquiry.status==='보류'?' selected':''}>보류</option>
    </select></label>`;
    
    html += `<div style="margin-top:24px;text-align:center;"><button type="submit" class="dashboard-top-btn" style="min-width:120px;">저장</button> <button type="button" class="dashboard-top-btn" id="btnCancel" style="min-width:120px;background:#b5942b;margin-left:10px;">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    
    document.getElementById('btnCancel').onclick = ()=>{ modal.style.display='none'; };
    document.getElementById('inquiryForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }

  // 렌더 함수를 전역으로 노출
  window.renderInquiries = reloadAndRender;
  
  document.addEventListener('DOMContentLoaded', async ()=>{ 
    await loadInquiries(); 
    render(); 
  });
})();
