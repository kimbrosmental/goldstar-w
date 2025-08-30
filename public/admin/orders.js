// 주문 관리 기능 (목록/상세/상태변경/문서다운로드)
(function(){
  let orders = [];
  
  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        orders = Array.isArray(data) ? data : [];
        console.log('주문 데이터 로드:', orders);
      } else {
        orders = [];
      }
    } catch (e) {
      console.error('주문 로드 오류:', e);
      orders = [];
    }
  }
  
  async function saveOrders() {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orders)
      });
      console.log('주문 데이터 저장 완료');
    } catch (e) {
      console.error('주문 저장 오류:', e);
    }
  }

  async function reloadAndRender() {
    await loadOrders();
    render();
  }
  
  function render(){
    var html = `<div style="margin-bottom:16px;">
      <button class="dashboard-top-btn" id="btnAddOrder">주문 추가</button>
      <button class="dashboard-top-btn" id="btnRefreshOrders" style="margin-left:10px;">새로고침</button>
    </div>`;
    
    html += '<table class="admin-table"><thead><tr><th>주문번호</th><th>주문일</th><th>회원</th><th>상품타입</th><th>금액</th><th>상태</th><th>메모</th><th>관리</th></tr></thead><tbody>';
    
    if (orders.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;color:#888;">주문이 없습니다.</td></tr>';
    } else {
      orders.forEach(function(o,i){
        html += `<tr>
          <td>${o.orderId||'주문'+(i+1)}</td>
          <td>${o.date ? new Date(o.date).toLocaleDateString('ko-KR') : ''}</td>
          <td>${o.username||''}</td>
          <td>${o.productType||''}</td>
          <td>${o.amount ? Number(o.amount).toLocaleString() + '원' : ''}</td>
          <td><span style="padding:2px 6px;border-radius:4px;background:${getStatusColor(o.status)};color:#fff;font-size:12px;">${o.status||'상태없음'}</span></td>
          <td>${o.memo||''}</td>
          <td style="white-space:nowrap;">
            <button class="dashboard-top-btn small list-btn" onclick="editOrder(${i})" style="margin:1px;">수정</button>
            <button class="dashboard-top-btn small list-btn" onclick="deleteOrder(${i})" style="margin:1px;">삭제</button>
            <button class="dashboard-top-btn small list-btn" onclick="changeStatusOrder(${i})" style="margin:1px;">상태변경</button>
          </td>
        </tr>`;
      });
    }
    
    html += '</tbody></table>';
    html += `<div id="orderModal" class="modal" style="display:none;"></div>`;
    document.getElementById('view-orders').innerHTML = html;
    
    document.getElementById('btnAddOrder').onclick = showAddOrder;
    document.getElementById('btnRefreshOrders').onclick = reloadAndRender;
  }

  function getStatusColor(status) {
    switch(status) {
      case '주문 승인 대기': return '#ff9800';
      case '입금대기': return '#2196f3';
      case '거래완료': return '#4caf50';
      case '취소': return '#f44336';
      default: return '#666';
    }
  }

  window.editOrder = function(idx){
    const o = orders[idx];
    showOrderModal('주문 정보 수정', o, function(data){
      orders[idx] = Object.assign({}, o, data);
      saveOrders().then(reloadAndRender);
    });
  };
  window.deleteOrder = function(idx){
    if(confirm('정말 삭제하시겠습니까?')){
      orders.splice(idx,1);
      saveOrders().then(reloadAndRender);
    }
  };
  window.changeStatusOrder = function(idx){
    const o = orders[idx];
    showOrderModal('주문 상태 변경', o, function(data){
      orders[idx].status = data.status;
      if (data.memo) orders[idx].memo = data.memo;
      saveOrders().then(reloadAndRender);
    }, true);
  };
  function showAddOrder(){
    showOrderModal('주문 추가', {}, function(data){
      const newOrder = Object.assign({}, data, { 
        orderId: 'ORD' + Date.now(), 
        date: new Date().toISOString(),
        created: new Date().toISOString()
      });
      orders.push(newOrder);
      saveOrders().then(reloadAndRender);
    });
  }

  // 렌더 함수를 전역으로 노출
  window.renderOrders = reloadAndRender;
  function showOrderModal(title, order, onSave, statusOnly){
    const modal = document.getElementById('orderModal');
    let html = `<div class="modal-content" style="background:linear-gradient(135deg,#fffbe6 80%,#f7e7b4 100%);padding:48px 48px 36px 48px;min-width:700px;max-width:900px;">`;
    html += `<h3 style="color:#b5942b;font-size:1.25em;margin-bottom:22px;font-weight:bold;">${title}</h3><form id="orderForm">`;
    if(!statusOnly){
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 32px;padding:12px 0 8px 0;align-items:start;">`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">회원<input name="username" value="${order.username||''}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">금액<input name="amount" type="number" value="${order.amount||0}" required style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">메모<input name="memo" value="${order.memo||''}" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;" ></label>`;
      html += `<label style="background:#003D33;color:#fff;border-radius:8px;font-size:1em;font-weight:bold;padding:14px 20px 10px 20px;display:flex;flex-direction:column;align-items:flex-start;">상태<select name="status" style="width:100%;font-size:1em;padding:10px 12px;margin-top:10px;border-radius:6px;border:1px solid #d4af37;box-sizing:border-box;">
        <option value="결제대기"${order.status==='결제대기'?' selected':''}>결제대기</option>
        <option value="결제완료"${order.status==='결제완료'?' selected':''}>결제완료</option>
        <option value="배송중"${order.status==='배송중'?' selected':''}>배송중</option>
        <option value="완료"${order.status==='완료'?' selected':''}>완료</option>
        <option value="취소"${order.status==='취소'?' selected':''}>취소</option>
        <option value="환불"${order.status==='환불'?' selected':''}>환불</option>
      </select></label>`;
      html += `</div>`;
    }
    html += `<div style="margin-top:24px;text-align:center;display:flex;gap:18px;justify-content:center;"><button type="submit" class="dashboard-top-btn" style="min-width:120px;">저장</button> <button type="button" class="dashboard-top-btn" id="btnCancel" style="min-width:120px;background:#b5942b;">취소</button></div>`;
    html += `</form></div>`;
    modal.innerHTML = html;
    modal.style.display = 'block';
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
  document.addEventListener('DOMContentLoaded', async ()=>{
    await loadOrders();
    render();
  });
})();
