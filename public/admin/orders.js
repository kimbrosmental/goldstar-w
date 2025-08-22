// 주문 관리 기능 (목록/상세/상태변경/문서다운로드)
(function(){
  // 샘플 주문 데이터
  let orders = [];
  // 암호화 저장/불러오기 함수
  async function saveOrders() {
    const encrypted = await window.encrypt(orders);
    await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted })
    });
  }
  async function loadOrders() {
    const res = await fetch('/api/admin/orders');
    const json = await res.json();
    orders = window.decrypt(json.data);
  }
  function render(){
  var html = `<button class="dashboard-top-btn" id="btnAddOrder">주문 추가</button>`;
    html += '<table class="admin-table"><thead><tr><th>주문번호</th><th>주문일</th><th>회원</th><th>금액</th><th>상태</th><th>메모</th><th>관리</th></tr></thead><tbody>';
    orders.forEach((o,i)=>{
      html += `<tr><td>${o.id}</td><td>${o.date}</td><td>${o.user}</td><td>${o.amount}</td><td>${o.status}</td><td>${o.memo}</td><td>
        <button class="dashboard-top-btn" style="padding:8px 18px;font-size:1em;" onclick="editOrder(${i})">수정</button>
        <button class="dashboard-top-btn" style="padding:8px 18px;font-size:1em;" onclick="deleteOrder(${i})">삭제</button>
        <button class="dashboard-top-btn" style="padding:8px 18px;font-size:1em;" onclick="changeStatusOrder(${i})">상태변경</button>
      </td></tr>`;
    });
    html += '</tbody></table>';
    html += `<div id="orderModal" class="modal" style="display:none;"></div>`;
    document.getElementById('view-orders').innerHTML = html;
    document.getElementById('btnAddOrder').onclick = showAddOrder;
  }

  window.editOrder = function(idx){
    const o = orders[idx];
    showOrderModal('주문 정보 수정', o, function(data){
      (async()=>{ orders[idx] = {...o, ...data}; await saveOrders(); render(); })();
    });
  };
  window.deleteOrder = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      (async()=>{ orders.splice(idx,1); await saveOrders(); render(); })();
    }
  };
  window.changeStatusOrder = function(idx){
    const o = orders[idx];
    showOrderModal('주문 상태 변경', o, function(data){
      (async()=>{ orders[idx].status = data.status; await saveOrders(); render(); })();
    }, true);
  };
  function showAddOrder(){
    showOrderModal('주문 추가', {}, function(data){
      (async()=>{ orders.push({...data, id:'O'+Date.now(), date:new Date().toISOString()}); await saveOrders(); render(); })();
    });
  }
  function showOrderModal(title, order, onSave, statusOnly){
    const modal = document.getElementById('orderModal');
    let html = `<div class="modal-content" style="background:linear-gradient(135deg,#fffbe6 80%,#f7e7b4 100%);padding:48px 48px 36px 48px;min-width:700px;max-width:900px;">`;
    html += `<h3 style="color:#b5942b;font-size:1.25em;margin-bottom:22px;font-weight:bold;">${title}</h3><form id="orderForm">`;
    if(!statusOnly){
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 32px;padding:12px 0 8px 0;align-items:start;">`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">회원<input name="user" value="${order.user||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">금액<input name="amount" type="number" value="${order.amount||0}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">메모<input name="memo" value="${order.memo||''}" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">상태<select name="status" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;"><option value="결제대기"${order.status==='결제대기'?' selected':''}>결제대기</option><option value="결제완료"${order.status==='결제완료'?' selected':''}>결제완료</option><option value="배송중"${order.status==='배송중'?' selected':''}>배송중</option><option value="완료"${order.status==='완료'?' selected':''}>완료</option><option value="취소"${order.status==='취소'?' selected':''}>취소</option><option value="환불"${order.status==='환불'?' selected':''}>환불</option></select></label>`;
      html += `</div>`;
    }
    html += `<div style="margin-top:24px;text-align:center;display:flex;gap:18px;justify-content:center;"><button type="submit" class="dashboard-top-btn" style="min-width:120px;">저장</button> <button type="button" class="dashboard-top-btn" id="btnCancel" style="min-width:120px;background:#b5942b;">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
    // 취소 버튼 이벤트 연결 (렌더링 직후 보장)
    document.getElementById('btnCancel').onclick = function(){
      modal.style.display = 'none';
    };
    document.getElementById('orderForm').onsubmit = function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      if(onSave) onSave(data);
      modal.style.display = 'none';
    };
  }
  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('DOMContentLoaded', async ()=>{ await loadOrders(); render(); });
})();
