// 1:1 문의 관리 기능 (목록/상세/답변)
(function(){
  // 샘플 문의 데이터
  let inquiries = [];
  // 암호화 저장/불러오기 함수
  async function saveInquiries() {
    const encrypted = await window.encrypt(inquiries);
    await fetch('/api/admin/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted })
    });
  }
  async function loadInquiries() {
    const res = await fetch('/api/admin/inquiries');
    const json = await res.json();
    inquiries = window.decrypt(json.data);
  }
  function render(){
    var html = `<button class="dashboard-top-btn" id="btnAddInquiry">문의 추가</button>`;
    html += '<table class="admin-table"><thead><tr><th>문의ID</th><th>회원</th><th>제목</th><th>생성일</th><th>상태</th><th>관리</th></tr></thead><tbody>';
    inquiries.forEach((q,i)=>{
      html += `<tr><td>${q.id}</td><td>${q.user}</td><td>${q.title}</td><td>${q.date}</td><td>${q.status}</td><td>
        <button class="dashboard-top-btn small list-btn" onclick="editInquiry(${i})">상세/답변</button>
        <button class="dashboard-top-btn small list-btn" onclick="deleteInquiry(${i})">삭제</button>
        <button class="dashboard-top-btn small list-btn" onclick="changeStatusInquiry(${i})">상태변경</button>
      </td></tr>`;
    });
    html += '</tbody></table>';
    html += `<div id="inquiryModal" class="modal" style="display:none;"></div>`;
    document.getElementById('view-inquiries').innerHTML = html;
    document.getElementById('btnAddInquiry').onclick = showAddInquiry;
  }

  window.editInquiry = function(idx){
    const q = inquiries[idx];
    showInquiryModal('문의 상세/답변', q, function(data){
      (async()=>{ inquiries[idx] = {...q, ...data, status:'답변완료'}; await saveInquiries(); render(); })();
    });
  };
  window.deleteInquiry = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      (async()=>{ inquiries.splice(idx,1); await saveInquiries(); render(); })();
    }
  };
  window.changeStatusInquiry = function(idx){
    const q = inquiries[idx];
    showInquiryModal('문의 상태 변경', q, function(data){
      (async()=>{ inquiries[idx].status = data.status; await saveInquiries(); render(); })();
    }, true);
  };
  function showAddInquiry(){
    showInquiryModal('문의 추가', {}, function(data){
      (async()=>{ inquiries.push({...data, id:'Q'+Date.now(), date:new Date().toISOString(), status:'미답변'}); await saveInquiries(); render(); })();
    });
  }
  function showInquiryModal(title, inquiry, onSave, statusOnly){
    const modal = document.getElementById('inquiryModal');
    let html = `<div class="modal-content"><h3>${title}</h3><form id="inquiryForm">`;
    if(!statusOnly){
      html += `<label>회원<input name="user" value="${inquiry.user||''}" required></label>`;
      html += `<label>제목<input name="title" value="${inquiry.title||''}" required></label>`;
      html += `<label>내용<textarea name="content">${inquiry.content||''}</textarea></label>`;
      html += `<label>답변<textarea name="answer">${inquiry.answer||''}</textarea></label>`;
    }
    html += `<label>상태<select name="status"><option value="미답변"${inquiry.status==='미답변'?' selected':''}>미답변</option><option value="답변완료"${inquiry.status==='답변완료'?' selected':''}>답변완료</option></select></label>`;
    html += `<div style="margin-top:16px;text-align:right;"><button type="submit" class="dashboard-top-btn">저장</button> <button type="button" class="dashboard-top-btn" id="btnCancel">취소</button></div>`;
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
  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('DOMContentLoaded', async ()=>{ await loadInquiries(); render(); });
})();
